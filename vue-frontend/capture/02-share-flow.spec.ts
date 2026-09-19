import { expect, test } from '@playwright/test'

import {
  SURVEY_SELECTIONS,
  createRecorder,
  forwardConsoleErrors,
  installCursor,
  seedAndGotoResult,
  slowClick,
  slowHover,
  waitForPdfSettled,
} from './helpers'

test('名前入力からPDFダウンロードの活性化まで', async ({ page }) => {
  const recorder = createRecorder(page, 'share-flow')
  forwardConsoleErrors(page)
  await installCursor(page)
  // survey-flow の続きとして見せるため、同じ回答から始める
  await seedAndGotoResult(page, SURVEY_SELECTIONS)
  await page.locator('[data-slot="skill-card"]').first().waitFor()
  await recorder.start()
  await page.waitForTimeout(800)

  await slowClick(page, page.getByRole('textbox', { name: /お名前/ }))
  await page.keyboard.type('山田太郎', { delay: 150 })
  await page.keyboard.press('Enter')
  // 確定（useNameCommit の confirmDelayMs 経過）を待つ
  await page.getByRole('button', { name: '名前を編集する' }).waitFor()
  await page.waitForTimeout(500)

  await slowClick(page, page.getByRole('button', { name: '結果を印刷/共有' }))
  await page.getByRole('menu').waitFor()

  // 生成が早く終わると「準備中」は一瞬で消え、状態で絞ると一致しなくなる。
  // 状態を問わずPDF項目を指す（文言は `src/components/PdfButton.vue` に合わせる）
  const pdfItem = page.getByRole('menuitem', {
    name: /^(PDFを準備中|PDFをダウンロード|PDF生成に失敗)/,
  })
  await slowHover(page, pdfItem)

  // 押すと別タブで開き撮影結果に残らないため、活性化した状態を見せて終える
  const pdfState = await waitForPdfSettled(page)
  expect(pdfState, 'PDF生成に失敗しました。暖機（00-warmup）の結果を確認してください').toBe('ready')
  await page.waitForTimeout(2000)

  await recorder.save()
})
