import { expect, test } from './fixture'

test.describe('ページ遷移フロー', () => {
  test('名前入力からアンケート回答、結果表示まで一連の操作ができる', async ({
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
    await expect(resultPage.heading).toContainText('山田太郎')
  })

  test('エンジニアカテゴリを選択して回答すると、結果ページにその内容が反映される', async ({
    topPage,
    surveyPage,
    resultPage,
  }) => {
    await topPage.goto()
    await topPage.selectCategory('プログラマ / ITエンジニア')
    await topPage.submit()

    await surveyPage.checkAnswer('HTML')
    await surveyPage.selectLevel(4)
    await surveyPage.submit()

    await resultPage.fillName('山田太郎')
    await expect(resultPage.heading).toContainText('山田太郎')
    await expect(resultPage.page.getByText('HTML')).toBeVisible()
  })

  test('チェックはしたが習熟度未選択の場合はエラーが表示され進めない', async ({
    topPage,
    surveyPage,
    page,
  }) => {
    await topPage.goto()
    await topPage.selectCategory('プログラマ / ITエンジニア')
    await topPage.submit()

    await surveyPage.checkAnswer('HTML')
    await surveyPage.submit()

    await expect(surveyPage.errorMessage).toBeVisible()
    await expect(page).toHaveURL(/#\/survey/)
  })
})

test.describe('名前の再編集', () => {
  test('確定した名前は「名前を編集する」から再編集でき、2回目の確定は編集ボタンを経由せず即ロックされる', async ({
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
    await expect(resultPage.heading).toContainText('山田太郎')

    await resultPage.startNameEdit()
    await expect(resultPage.nameInput).toBeEditable()

    await resultPage.nameInput.fill('田中次郎')
    await resultPage.nameInput.blur()

    // 確定を待つ（useNameCommitのconfirmDelayMs経過後）
    await expect(resultPage.heading).toContainText('田中次郎')
    // 1回目と異なり、確定直後に「名前を編集する」ボタンは再表示されない
    // （editUsedフラグにより committed フェーズを経由せず locked へ直行するため）
    await expect(resultPage.page.getByRole('button', { name: '名前を編集する' })).toBeHidden()
  })
})
