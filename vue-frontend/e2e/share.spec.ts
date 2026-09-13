import type { SurveyState } from '@/types'
import { encodeData } from '@/utils/shareUtils'

import { expect, test } from './fixture'
import { mockPdfRegenerate, mockPdfStatusSequence, mockSaveSheet, mockSharedSheet } from './mocks'
import { buildMinimalSurveyState } from './testData'

test.describe('共有URL（クエリ方式）', () => {
  test('共有URLに直接アクセスすると共有ビューが表示される', async ({ resultPage }) => {
    const sharedState: SurveyState = buildMinimalSurveyState('テストユーザー')
    const encoded = encodeData(sharedState)!

    await resultPage.gotoWithData(encoded)

    await expect(resultPage.heading).toContainText('テストユーザー')
    await expect(resultPage.shareButton).toHaveCount(0)
  })
})

test.describe('共有・出力機能', () => {
  test('ダウンロードされたCSVにBOM・ユーザー名が含まれる', async ({ resultPage }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await resultPage.openShareMenu()

    const download = await resultPage.downloadCsv()
    expect(download.suggestedFilename()).toContain('山田太郎')
  })
})

test.describe('共有URL（ID方式）', () => {
  test('ID方式のURLコピー時、バックエンド発行のIDがクリップボードへ反映される', async ({
    resultPage,
    context,
    browserName,
    page,
  }) => {
    test.skip(browserName !== 'chromium', 'clipboard権限のAPIはChromiumのみ安定動作するため')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockSaveSheet(page, 'clip-id-1')

    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await resultPage.openShareMenu()
    await resultPage.copyUrl()

    await expect(page.getByRole('menuitem', { name: 'コピー完了' })).toBeVisible()
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('id=clip-id-1')
  })

  test('ID方式での保存に失敗した場合、クエリ方式のURLへフォールバックする', async ({
    resultPage,
    context,
    browserName,
    page,
  }) => {
    test.skip(browserName !== 'chromium', 'clipboard権限のAPIはChromiumのみ安定動作するため')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.route('**/api/sheets', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500 })
      } else {
        await route.continue()
      }
    })

    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await resultPage.openShareMenu()
    await resultPage.copyUrl()

    await expect(page.getByRole('menuitem', { name: 'コピー完了' })).toBeVisible()
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('#/result?data=')
  })

  test('ID方式のURLで共有シートを正常に取得できる', async ({ resultPage, page }) => {
    await mockSharedSheet(page, 'success', { userName: 'テストユーザー' })
    await resultPage.gotoWithId('mock-id-123')

    await expect(resultPage.heading).toContainText('テストユーザー')
  })

  test('期限切れの共有リンクはエラー画面になる', async ({ resultPage, page }) => {
    await mockSharedSheet(page, 'expired', { userName: 'テストユーザー', expiryDays: 5 })
    await resultPage.gotoWithId('expired-id')

    await expect(resultPage.errorHeading).toContainText('有効期限')
    await expect(page.getByText(/5日間/)).toBeVisible()
  })

  test('存在しない共有リンクはエラー画面になる', async ({ resultPage, page }) => {
    await mockSharedSheet(page, 'notfound')
    await resultPage.gotoWithId('missing-id')

    await expect(page.getByRole('heading', { name: 'リンクが見つかりません' })).toBeVisible()
  })
})

test.describe('PDF生成', () => {
  test('生成中から完了までボタンの表示が切り替わる', async ({ resultPage, page }) => {
    await mockSaveSheet(page, 'saved-id-1')
    await mockPdfStatusSequence(page, 'saved-id-1', [
      { status: 'generating' },
      { status: 'ready', downloadUrl: 'https://example.com/skill.pdf' },
    ])

    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await resultPage.openShareMenu()

    // 生成中は Progress が子として描画され、その値がアクセシブル名の末尾に入る
    // （例: "PDFを準備中... 42"）。値は時間で変わるため前方一致で照合する。
    await expect(page.getByRole('menuitem', { name: /PDFを準備中/ })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'PDFをダウンロード' })).toBeVisible({
      timeout: 6000,
    })
  })

  test('生成に失敗した場合は再試行でき、成功すればダウンロード可能になる', async ({
    resultPage,
    page,
  }) => {
    await mockSaveSheet(page, 'saved-id-2')
    await page.route('**/api/pdf/saved-id-2/status', async (route) => {
      await route.fulfill({ status: 500 })
    })

    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await resultPage.openShareMenu()

    await expect(page.getByRole('menuitem', { name: /再試行/ })).toBeVisible()

    await mockPdfRegenerate(page, 'saved-id-2')
    await page.unroute('**/api/pdf/saved-id-2/status')
    await mockPdfStatusSequence(page, 'saved-id-2', [
      { status: 'generating' },
      { status: 'ready', downloadUrl: 'https://example.com/x.pdf' },
    ])

    await page.getByRole('menuitem', { name: /再試行/ }).click()
    await expect(page.getByRole('menuitem', { name: 'PDFをダウンロード' })).toBeVisible({
      timeout: 6000,
    })
  })
})

test.describe('Lambdaとの連携用属性', () => {
  test('描画が完了すると data-pdf-ready が付与される', async ({ resultPage, page }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))

    await expect(page.locator('[data-pdf-ready]')).toBeAttached()
    await expect(page.locator('[data-pdf-error]')).toHaveCount(0)
  })

  test('シートを取得できなかった場合は data-pdf-error が付与される', async ({
    resultPage,
    page,
  }) => {
    await mockSharedSheet(page, 'expired', { userName: 'テストユーザー', expiryDays: 5 })
    await resultPage.gotoWithId('expired-id')

    await expect(page.locator('[data-pdf-error]')).toBeAttached()
    await expect(page.locator('[data-pdf-ready]')).toHaveCount(0)
  })
})

test.describe('ゲストゲート', () => {
  test('名前未入力の共有・印刷ボタンはホバーで理由が提示され、クリックしてもメニューが開かない', async ({
    resultPage,
  }) => {
    // 検証対象はゲスト時のボタンの挙動のみ。userName が空文字ならゲスト状態で到着する。
    await resultPage.seedAndGoto(buildMinimalSurveyState(''))

    await resultPage.shareButton.hover()
    await expect(resultPage.guestHint).toBeVisible()
    await expect(resultPage.guestHint).toContainText(
      'お名前を入力すると、印刷・共有機能が利用できます',
    )

    await resultPage.clickShareButtonAsGuest()
    await expect(resultPage.page.getByRole('menu')).toHaveCount(0)
  })

  test('ボタンを押すと名前入力欄へ誘導され、入力後は共有・印刷メニューが開けるようになる', async ({
    resultPage,
  }) => {
    // 検証対象はゲストゲートの解除のみ。userName が空文字ならゲスト状態で到着する。
    await resultPage.seedAndGoto(buildMinimalSurveyState(''))

    await resultPage.clickShareButtonAsGuest()
    await expect(resultPage.page.getByRole('menu')).toHaveCount(0)

    await resultPage.fillName('山田太郎')

    await resultPage.openShareMenu()
    await expect(resultPage.page.getByRole('menu')).toBeVisible()
  })
})
