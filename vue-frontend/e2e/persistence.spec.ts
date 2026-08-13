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

  test('習熟度（星）の値もリロード後に復元される', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await page.getByRole('checkbox', { name: 'Slack' }).check()
    await page.getByRole('radio', { name: '5段階' }).locator('..').click()

    await page.reload()

    await expect(page.getByRole('radio', { name: '5段階' }).first()).toBeChecked()
  })

  test('ResultPage まで進んだ状態でリロードしても表示内容が保たれる', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await page.getByRole('button', { name: '次へ進む' }).click()
    await expect(page).toHaveURL(/#\/result/)

    await page.reload()

    await expect(page.getByRole('heading', { name: /山田太郎 様のスキルシート/ })).toBeVisible()
  })

  test('localStorageを削除するとSurveyPageからトップへ強制送還される', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await expect(page).toHaveURL(/#\/survey/)

    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page).toHaveURL(/#\/$|#$/)
  })
})
