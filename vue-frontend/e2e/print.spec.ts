import { expect, test } from '@playwright/test'

async function completeBasicFlow(page: import('@playwright/test').Page, name: string) {
  await page.goto('/')
  await page.getByLabel('お名前を入力してください').fill(name)
  await page.getByRole('button', { name: 'アンケートを開始' }).click()

  await page.getByRole('checkbox', { name: 'Slack' }).check()
  await page.getByRole('radio', { name: '3段階' }).locator('..').click()

  await page.getByRole('button', { name: '次へ進む' }).click()
}

test.describe('印刷スタイル', () => {
  test('印刷プレビュー時に操作ボタン群が非表示になる', async ({ page }) => {
    await completeBasicFlow(page, '山田太郎')
    await expect(page.locator('.button-group')).toBeVisible()
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.button-group')).toBeHidden()
  })

  test('印刷プレビュー時、ヘッダーとフッターも非表示になる', async ({ page }) => {
    await completeBasicFlow(page, '山田太郎')
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('header.header')).toBeHidden()
    await expect(page.locator('footer.footer')).toBeHidden()
  })

  test('印刷時、スキルカードにbreak-inside: avoidが適用される', async ({ page }) => {
    await completeBasicFlow(page, '山田太郎')
    await page.emulateMedia({ media: 'print' })
    const breakInside = await page
      .locator('.skill-card')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside)
    expect(breakInside).toBe('avoid')
  })

  test('印刷ボタンクリックでwindow.printが呼び出される', async ({ page }) => {
    await completeBasicFlow(page, '山田太郎')
    const printCalls: number[] = []
    await page.exposeFunction('__print', () => printCalls.push(1))
    await page.evaluate(() => {
      window.print = () => (window as unknown as { __print: () => void }).__print()
    })
    await page.getByRole('button', { name: '印刷する' }).click()
    expect(printCalls.length).toBe(1)
  })
})
