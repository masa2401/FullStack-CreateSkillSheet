import { expect, test } from '@playwright/test'

test.describe('レスポンシブ表示', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('モバイル幅で横スクロールが発生しない', async ({ page }) => {
    await page.goto('/')

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalScroll).toBe(false)
  })
})
