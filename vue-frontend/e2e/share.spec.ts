import test, { expect } from '@playwright/test'

import type { SurveyState } from '@/types'
import { encodeData } from '@/utils/shareUtils'

async function completeBasicFlow(page: import('@playwright/test').Page, name: string) {
  await page.goto('/')
  await page.getByLabel('お名前を入力してください').fill(name)
  await page.getByRole('button', { name: 'アンケートを開始' }).click()
  await page.getByRole('button', { name: '次へ進む' }).click()
}

test.describe('共有URL（フロントエンド完結）', () => {
  test('data パラメータ付きURLに直接アクセスすると共有ビューが表示される', async ({ page }) => {
    const sharedState: SurveyState = {
      userName: 'テストユーザー',
      selections: [
        {
          categoryId: 1,
          isChecked: true,
          questions: [
            {
              questionId: 1,
              answers: [{ answerId: 1, isChecked: true, value: 4 }],
            },
          ],
        },
      ],
    }
    const encoded = encodeData(sharedState)

    await page.goto(`/#/result?data=${encoded}`)

    await expect(
      page.getByRole('heading', { name: /テストユーザー 様のスキルシート/ }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '結果を共有' })).toHaveCount(0)
  })
})

test.describe('共有・出力機能', () => {
  test('CSVダウンロードが発火する', async ({ page }) => {
    await completeBasicFlow(page, '山田太郎')

    await page.getByRole('button', { name: '結果を共有' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSVとして保存' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('山田太郎')
  })

  test('URLコピーがクリップボードに反映される', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard権限のAPIはChromiumのみ安定動作するため')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await completeBasicFlow(page, '山田太郎')
    await page.getByRole('button', { name: '結果を共有' }).click()
    await page.getByRole('button', { name: 'URLをコピー' }).click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('#/result?data=')
  })
})

test.describe('共有URL（バックエンド連携）', () => {
  test('idパラメータで共有シートを正常に取得できる', async ({ page }) => {
    await page.route('**/api/sheets/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userName: 'mockUser',
          categories: [
            { categoryId: 1, questions: [{ questionId: 1, answers: [{ answerId: 1, value: 4 }] }] },
          ],
        }),
      })
    })

    await page.goto('/#/result?id=mock-id-123')

    await expect(page.getByRole('heading', { name: /mockUser 様のスキルシート/ })).toBeVisible()
  })

  test('期限切れの共有リンクはエラー画面になる', async ({ page }) => {
    await page.route('**/api/sheets/*', async (route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ expiryDays: 5 }),
      })
    })

    await page.goto('/#/result?id=expired-id')

    await expect(page.getByRole('heading', { name: /有効期限/ })).toBeVisible()

    await expect(page.getByText(/5日間/)).toBeVisible()
  })

  test('存在しない共有リンクはエラー画面になる', async ({ page }) => {
    await page.route('**/api/sheets/*', async (route) => {
      await route.fulfill({ status: 404 })
    })

    await page.goto('/#/result?id=missing-id')

    await expect(page.getByRole('heading', { name: 'リンクが見つかりません' })).toBeVisible()
  })
})

test.describe('PDF生成', () => {
  test('生成中から完了までボタンの表示が切り替わる', async ({ page }) => {
    await page.route('**/api/sheets', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'saved-id-1' }),
        })
      } else {
        await route.continue()
      }
    })

    let statusCallCount = 0
    await page.route('**/api/pdf/saved-id-1/status', async (route) => {
      statusCallCount++
      const body =
        statusCallCount === 1
          ? { status: 'generating' }
          : { status: 'ready', downloadUrl: 'https://example.com/skill.pdf' }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })

    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await page.getByRole('button', { name: '次へ進む' }).click()
    await page.getByRole('button', { name: '結果を共有' }).click()

    await expect(page.getByRole('button', { name: 'PDFを準備中...' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'PDFをダウンロード' })).toBeVisible({
      timeout: 6000,
    })
  })

  test('生成に失敗した場合は再試行でき、成功すればダウンロード可能になる', async ({ page }) => {
    await page.route('**/api/sheets', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'saved-id-2' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.route('**/api/pdf/saved-id-2/status', async (route) => {
      await route.fulfill({ status: 500 })
    })

    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await page.getByRole('button', { name: '次へ進む' }).click()
    await page.getByRole('button', { name: '結果を共有' }).click()

    await expect(page.getByRole('button', { name: /再試行/ })).toBeVisible()

    await page.route('**/api/pdf/saved-id-2/regenerate', async (route) => {
      await route.fulfill({ status: 202 })
    })

    let retryCallCount = 0
    await page.unroute('**/api/pdf/saved-id-2/status')
    await page.route('**/api/pdf/saved-id-2/status', async (route) => {
      retryCallCount++
      const body =
        retryCallCount === 1
          ? { status: 'generating' }
          : { status: 'ready', downloadUrl: 'https://example.com/x.pdf' }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })

      await page.getByRole('button', { name: /再試行/ }).click()
      await expect(page.getByRole('button', { name: 'PDFをダウンロード' })).toBeVisible({
        timeout: 6000,
      })
    })
  })
})
