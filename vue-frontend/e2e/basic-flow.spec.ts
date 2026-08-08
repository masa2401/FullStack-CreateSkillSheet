import { expect, test } from '@playwright/test'

test.describe('スキルシート作成の基本フロー', () => {
  test('名前入力からアンケート回答、結果表示まで一連の操作ができる', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await expect(page.getByRole('heading', { name: '山田太郎 様' })).toBeVisible()
    await page.getByRole('button', { name: '次へ進む' }).click()
    await expect(page.getByRole('heading', { name: /山田太郎 様のスキルシート/ })).toBeVisible()
  })

  test('名前未入力の場合はエラーが表示され、次へ進めない', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/#\/$|#$/)
  })
})

test.describe('SurveyPageのバリデーション', () => {
  test('チェックはしたが習熟度未選択の場合はエラーが表示され進めない', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')

    const engineerCheckbox = page.getByRole('checkbox', { name: 'プログラマ / ITエンジニア' })
    await engineerCheckbox.locator('..').click()
    await page.getByRole('button', { name: 'アンケートを開始' }).click()

    await page.getByRole('checkbox', { name: 'HTML' }).check()
    await page.getByRole('button', { name: '次へ進む' }).click()

    await expect(page.locator('#error-message')).toBeVisible()
    await expect(page).toHaveURL(/#\/survey/)
  })
})
