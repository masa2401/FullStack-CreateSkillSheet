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
})
