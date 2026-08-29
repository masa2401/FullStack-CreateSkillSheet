import { expect, test } from './fixture'

test.describe('データ永続化', () => {
  test('リロードしても入力途中のデータが復元される', async ({ topPage, surveyPage }) => {
    await topPage.goto()
    await topPage.submit()

    await surveyPage.checkAnswer('Slack')
    await surveyPage.page.reload()

    await expect(surveyPage.answerCheckbox('Slack')).toBeChecked()
  })

  test('習熟度（星）の値もリロード後に復元される', async ({ topPage, surveyPage }) => {
    await topPage.goto()
    await topPage.submit()

    await surveyPage.checkAnswer('Slack')
    await surveyPage.selectLevel(5)
    await surveyPage.page.reload()

    await expect(surveyPage.levelRadio(5)).toBeChecked()
  })

  test('ResultPage まで進んだ状態でリロードしても回答内容が保たれる', async ({
    topPage,
    surveyPage,
    resultPage,
    page,
  }) => {
    await topPage.goto()
    await topPage.submit()
    await surveyPage.checkAnswer('Slack')
    await surveyPage.selectLevel(3)
    await surveyPage.submit()
    await expect(page).toHaveURL(/#\/result/)

    await resultPage.page.reload()

    // 強制送還されずResultPageに留まっている = 回答（selections）が保持されている
    await expect(page).toHaveURL(/#\/result/)
    await expect(resultPage.page.getByText('Slack')).toBeVisible()
  })

  test('名前を確定した状態でリロードしても入力した名前が保たれる', async ({
    topPage,
    surveyPage,
    resultPage,
  }) => {
    await topPage.goto()
    await topPage.submit()
    await surveyPage.checkAnswer('Slack')
    await surveyPage.selectLevel(3)
    await surveyPage.submit()

    await resultPage.fillName('山田太郎')
    await resultPage.page.reload()

    await expect(resultPage.heading).toContainText('山田太郎')
  })

  test('localStorageを削除した状態でResultPageへ直接アクセスするとトップへ強制送還される', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/#/result')

    await expect(page).toHaveURL(/#\/$|#$/)
  })
})
