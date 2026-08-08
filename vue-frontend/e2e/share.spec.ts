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
