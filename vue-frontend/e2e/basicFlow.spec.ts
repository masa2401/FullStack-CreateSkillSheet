import { expect, test } from './fixture'

test.describe('ページ遷移フロー', () => {
  test('名前入力からアンケート回答、結果表示まで一連の操作ができる', async ({
    topPage,
    surveyPage,
    resultPage,
  }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()
    await expect(surveyPage.userGreeting).toContainText('山田太郎')

    await surveyPage.submit()
    await expect(resultPage.heading).toContainText('山田太郎')
  })

  test('エンジニアカテゴリを選択して回答すると、結果ページにその内容が反映される', async ({
    topPage,
    surveyPage,
    resultPage,
  }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.selectCategory('プログラマ / ITエンジニア')
    await topPage.submit()

    await surveyPage.checkAnswer('HTML')
    await surveyPage.selectLevel(4)
    await surveyPage.submit()

    await expect(resultPage.heading).toContainText('山田太郎')
    await expect(resultPage.page.getByText('HTML')).toBeVisible()
  })

  test('名前未入力の場合はエラーが表示され、次へ進めない', async ({ topPage, page }) => {
    await topPage.goto()
    await topPage.submit()

    await expect(topPage.errorMessage).toBeVisible()
    await expect(page).toHaveURL(/#\/$|#$/)
  })

  test('チェックはしたが習熟度未選択の場合はエラーが表示され進めない', async ({
    topPage,
    surveyPage,
    page,
  }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.selectCategory('プログラマ / ITエンジニア')
    await topPage.submit()

    await surveyPage.checkAnswer('HTML')
    await surveyPage.submit()

    await expect(surveyPage.errorMessage).toBeVisible()
    await expect(page).toHaveURL(/#\/survey/)
  })
})
