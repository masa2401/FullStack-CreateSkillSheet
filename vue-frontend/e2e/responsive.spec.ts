import { expect, test } from './fixture'
import { buildMinimalSurveyState } from './testData'

test.describe('レスポンシブ表示', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  const expectNoHorizontalScroll = async (page: import('@playwright/test').Page) => {
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalScroll).toBe(false)
  }

  test('TopPageでモバイル幅の横スクロールが発生しない', async ({ topPage, page }) => {
    await topPage.goto()
    await expectNoHorizontalScroll(page)
  })

  test('SurveyPageでモバイル幅の横スクロールが発生しない', async ({ topPage, page }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()
    await expectNoHorizontalScroll(page)
  })

  test('ResultPageでモバイル幅の横スクロールが発生しない', async ({ resultPage, page }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await expectNoHorizontalScroll(page)
  })

  test('TopPageのカテゴリカードがモバイル幅で1カラムに切り替わる', async ({ topPage }) => {
    await topPage.goto()
    const gridColumns = await topPage.page
      .locator('.category-cards')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns)

    const columnCount = gridColumns.trim().split(/\s+/).length
    expect(columnCount).toBe(1)
  })

  test('SurveyPageで説明用画像が非表示になる', async ({ topPage, page }) => {
    await topPage.goto()
    await topPage.fillName('山田太郎')
    await topPage.submit()

    await expect(page.locator('.image')).toBeHidden()
  })

  test('ResultPageで説明用画像が非表示になる', async ({ resultPage }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))
    await expect(resultPage.page.locator('.image')).toBeHidden()
  })
})
