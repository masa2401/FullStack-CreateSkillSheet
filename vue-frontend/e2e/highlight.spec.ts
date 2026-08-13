import { expect, test } from '@playwright/test'

test.describe('選択状態の見た目', () => {
  test('カテゴリカードを選択すると背景色がハイライトされる', async ({ page }) => {
    await page.goto('/')
    const engineerCheckbox = page.getByRole('checkbox', { name: 'プログラマ / ITエンジニア' })
    const engineerCard = engineerCheckbox.locator('..')

    await expect(engineerCard).not.toHaveCSS('border-color', 'rgb(72, 60, 50)')
    await engineerCard.click()
    await expect(engineerCard).toHaveCSS('border-color', 'rgb(72, 60, 50)')
  })

  test('カード選択時、タイトルと説明文の文字色が白に反転する', async ({ page }) => {
    await page.goto('/')
    const engineerCard = page
      .getByRole('checkbox', { name: 'プログラマ / ITエンジニア' })
      .locator('..')
    const title = engineerCard.locator('.card-category-title')
    const description = engineerCard.locator('.card-category-desc')

    await expect(title).toHaveCSS('color', 'rgb(72, 60, 50)')
    await expect(description).toHaveCSS('color', 'rgb(102, 102, 102)')
    await engineerCard.click()
    await expect(title).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(description).toHaveCSS('color', 'rgb(255, 255, 255)')
  })

  test('習熟度ボタン選択時、AnswerItemのlevel-buttonが実際にハイライトされる', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('お名前を入力してください').fill('山田太郎')
    await page.getByRole('button', { name: 'アンケートを開始' }).click()
    await page.getByRole('checkbox', { name: 'Slack' }).check()

    const level3 = page.getByRole('radio', { name: '3段階' }).first().locator('..')
    await expect(level3).not.toHaveCSS('background-color', 'rgb(72, 60, 50)')
    await level3.click()
    await expect(level3).toHaveCSS('background-color', 'rgb(72, 60, 50)')
  })
})
