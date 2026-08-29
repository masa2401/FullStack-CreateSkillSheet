import { expect, test } from './fixture'
import { buildMinimalSurveyState } from './testData'

test.describe('印刷スタイル', () => {
  test('印刷プレビュー時に操作ボタン群が非表示になる', async ({ resultPage }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))

    await expect(resultPage.buttonGroup).toBeVisible()
    await resultPage.page.emulateMedia({ media: 'print' })
    await expect(resultPage.buttonGroup).toBeHidden()
  })

  test('印刷プレビュー時、ヘッダーとフッターも非表示になる', async ({ resultPage, page }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await resultPage.page.emulateMedia({ media: 'print' })

    await expect(page.locator('header.header')).toBeHidden()
    await expect(page.locator('footer.footer')).toBeHidden()
  })

  test('印刷時、スキルカードにbreak-inside: avoidが適用される', async ({ resultPage, page }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))

    await resultPage.page.emulateMedia({ media: 'print' })
    const breakInside = await page
      .locator('.skill-card')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside)
    expect(breakInside).toBe('avoid')
  })

  test('印刷ボタンクリックでwindow.printが呼び出される', async ({ resultPage, page }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    const printCalls: number[] = []
    await page.exposeFunction('__print', () => printCalls.push(1))
    await page.evaluate(() => {
      window.print = () => (window as unknown as { __print: () => void }).__print()
    })
    await resultPage.print()
    expect(printCalls.length).toBe(1)
  })
})
