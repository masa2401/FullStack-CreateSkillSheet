import { expect, test } from './fixture'

test.describe('選択状態の見た目', () => {
  test('カテゴリカードを選択すると背景色がハイライトされる', async ({ topPage }) => {
    await topPage.goto()
    const engineerCard = topPage.categoryCard('プログラマ / ITエンジニア')

    await expect(engineerCard).not.toHaveCSS('border-color', 'rgb(72, 60, 50)')
    await engineerCard.click()
    await expect(engineerCard).toHaveCSS('border-color', 'rgb(72, 60, 50)')
  })

  test('カード選択時、タイトルと説明文の文字色が白に反転する', async ({ topPage }) => {
    await topPage.goto()

    const engineerCard = topPage.categoryCard('プログラマ / ITエンジニア')
    const title = engineerCard.locator('.card-category-title')
    const description = engineerCard.locator('.card-category-desc')

    await expect(title).toHaveCSS('color', 'rgb(72, 60, 50)')
    await expect(description).toHaveCSS('color', 'rgb(102, 102, 102)')

    await engineerCard.click()
    await expect(title).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(description).toHaveCSS('color', 'rgb(255, 255, 255)')
  })

  test('習熟度ボタン選択時、AnswerItemのlevel-buttonが実際にハイライトされる', async ({
    topPage,
    surveyPage,
  }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()

    await surveyPage.checkAnswer('Slack')

    const level3 = surveyPage.levelRadio(3).locator('..')
    await expect(level3).not.toHaveCSS('background-color', 'rgb(72, 60, 50)')

    await surveyPage.selectLevel(3)
    await expect(level3).toHaveCSS('background-color', 'rgb(72, 60, 50)')
  })
})
