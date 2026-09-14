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

    await expect(page.locator('header')).toBeHidden()
    await expect(page.locator('footer')).toBeHidden()
  })

  test('印刷時、スキルカードにbreak-inside: avoidが適用される', async ({ resultPage, page }) => {
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))

    await resultPage.page.emulateMedia({ media: 'print' })
    const breakInside = await page
      .locator('[data-slot="skill-card"]')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside)
    expect(breakInside).toBe('avoid')
  })

  test('印刷時、カテゴリCardがブロックレイアウトへ切り替わる', async ({ resultPage, page }) => {
    // WebKit は column フレックスのページ分割が未実装で、内側の break-inside: avoid が
    // 効かない。印刷時のみブロック化して分割可能にしている。この指定が外れると
    // WebKit でのみ改ページ位置が崩れるため、computed style で回帰を検出する。
    // 分割結果そのものは検証できない（page.pdf() は Chromium 専用）。
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))

    await resultPage.page.emulateMedia({ media: 'print' })
    // 先頭は凡例を持つヘッダー Card。こちらは break-inside: avoid で
    // ページをまたがせない前提のためフレックスのまま残す。検証対象は2枚目以降。
    const display = await page
      .locator('[data-slot="card"]')
      .nth(1)
      .evaluate((el) => getComputedStyle(el).display)
    expect(display).toBe('block')
  })

  test('印刷時、スキル項目の横並びレイアウトは維持される', async ({ resultPage, page }) => {
    // Card のブロック化が中身のフレックスへ波及していないことの確認。
    // skill-info は Card の孫以下で独立したフレックスコンテキストを持つため、
    // 親の display に関わらず横並びが保たれる。
    await resultPage.seedAndGoto(buildMinimalSurveyState('山田太郎'))

    await resultPage.page.emulateMedia({ media: 'print' })
    const { display, flexDirection } = await page
      .locator('[data-slot="skill-info"]')
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el)
        return { display: style.display, flexDirection: style.flexDirection }
      })
    expect(display).toBe('flex')
    expect(flexDirection).toBe('row')
  })
})
