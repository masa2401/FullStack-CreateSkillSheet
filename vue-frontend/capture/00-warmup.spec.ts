import { expect, test } from '@playwright/test'

import {
  SURVEY_SELECTIONS,
  forwardConsoleErrors,
  seedAndGotoResult,
  waitForPdfSettled,
} from './helpers'

/**
 * 録画の前に本番のバックエンド（Railway）と PDF 生成（Lambda）を起動しておく。
 * コールドスタート中は生成がアプリ側の打ち切り（60秒）に間に合わず失敗するため、
 * ここで一度 PDF を作り切ってから share-flow を録画する。
 * ファイル名の番号順で最初に実行される。録画はしない。
 */
test.use({ video: 'off' })

test('本番環境の暖機', async ({ page }) => {
  // 打ち切りからの再試行を含めて待つ
  test.setTimeout(180_000)
  forwardConsoleErrors(page)

  await seedAndGotoResult(page, SURVEY_SELECTIONS)
  const nameInput = page.getByRole('textbox', { name: /お名前/ })
  await nameInput.fill('山田太郎')
  await nameInput.press('Enter')
  await page.getByRole('button', { name: '名前を編集する' }).waitFor()

  await page.getByRole('button', { name: '結果を印刷/共有' }).click()
  await page.getByRole('menu').waitFor()

  let pdfState = await waitForPdfSettled(page)
  if (pdfState === 'error') {
    // 初回は起動待ちで打ち切られることがある。起動後の再生成で完了を確認する
    await page.getByRole('menuitem', { name: /再試行/ }).click()
    // 失敗表示が残ったまま判定しないよう、生成中に戻ったことを確認してから待つ
    await page.getByRole('menuitem', { name: /PDFを準備中/ }).waitFor()
    pdfState = await waitForPdfSettled(page)
  }
  expect(pdfState, '暖機でも PDF 生成に失敗しました').toBe('ready')
})
