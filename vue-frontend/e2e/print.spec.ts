import { expect, test } from '@playwright/test'

async function completeBasicFlow(page: import('@playwright/test').Page, name: string) {
  await page.goto('/')
  await page.getByLabel('お名前を入力してください').fill(name)
  await page.getByRole('button', { name: 'アンケートを開始' }).click()
  await page.getByRole('button', { name: '次へ進む' }).click()
}

test.describe('印刷スタイル', () => {
  test('印刷プレビュー時に操作ボタン群が非表示になる', async ({ page }) => {
    await completeBasicFlow(page, '山田太郎')
    await expect(page.locator('.button-group')).toBeVisible()
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.button-group')).toBeHidden()
  })
})
