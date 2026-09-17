import { test } from '@playwright/test'

import { answerSkill, createRecorder, installCursor, slowClick } from './helpers'

test('カテゴリ選択から結果表示まで', async ({ page }) => {
  const recorder = createRecorder(page, 'survey-flow')
  await installCursor(page)
  await page.goto('/')

  const engineerCard = page.locator('[data-slot="category-card"]').filter({
    has: page.getByRole('checkbox', { name: 'プログラマ / ITエンジニア' }),
  })
  await engineerCard.waitFor()
  recorder.markReady()
  // 冒頭に静止を作る
  await page.waitForTimeout(500)

  await slowClick(page, engineerCard)
  await slowClick(page, page.getByRole('button', { name: 'アンケートを開始' }))

  const submitButton = page.getByRole('button', { name: '次へ進む' })
  await submitButton.waitFor()
  await page.waitForTimeout(300)

  // 回答は helpers.ts の SURVEY_SELECTIONS と揃える
  await answerSkill(page, 'Slack', 4)
  await answerSkill(page, 'TypeScript', 4)
  await slowClick(page, submitButton)

  await page.locator('[data-slot="skill-card"]').first().waitFor()
  // 結果を見せる時間
  await page.waitForTimeout(1200)

  await recorder.save()
})
