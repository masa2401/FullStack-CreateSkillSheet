import { expect, test } from './fixture'

test.describe('データ永続化', () => {
  test('リロードしても入力途中のデータが復元される', async ({ topPage, surveyPage }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()

    await surveyPage.checkAnswer('Slack')
    await surveyPage.page.reload()

    await expect(surveyPage.userGreeting).toBeVisible()
    await expect(surveyPage.answerCheckbox('Slack')).toBeChecked()
  })

  test('習熟度（星）の値もリロード後に復元される', async ({ topPage, surveyPage }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()

    await surveyPage.checkAnswer('Slack')
    await surveyPage.selectLevel(5)
    await surveyPage.page.reload()

    await expect(surveyPage.levelRadio(5)).toBeChecked()
  })

  test('ResultPage まで進んだ状態でリロードしても表示内容が保たれる', async ({
    topPage,
    surveyPage,
    resultPage,
    page,
  }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()
    await surveyPage.submit()
    await expect(page).toHaveURL(/#\/result/)

    await resultPage.page.reload()

    await expect(resultPage.heading).toContainText('山田太郎')
  })

  test('localStorageを削除するとSurveyPageからトップへ強制送還される', async ({
    topPage,
    surveyPage,
    page,
  }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()
    await expect(page).toHaveURL(/#\/survey/)

    await page.evaluate(() => localStorage.clear())
    await surveyPage.page.reload()

    await expect(page).toHaveURL(/#\/$|#$/)
  })
})
