import { expect, test } from '@playwright/test'

test.describe('データ永続化', () => {
  test('リロードしても入力途中のデータが復元される', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('永続化テスト')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await page.getByRole('checkbox', { name: 'Slack' }).check()

    await page.reload()

    await expect(page.getByRole('heading', { name: /永続化テスト 様/ })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Slack' })).toBeChecked()
  })
})
