import type { Locator } from '@playwright/test'

import { expect, test } from './fixture'

/** 具体的な色を固定せず、選択前後で計算値が変化したことだけを検証する */
const styleOf = (locator: Locator, property: string): Promise<string> =>
  locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property)

test.describe('選択状態の見た目', () => {
  test('カテゴリカードを選択すると背景色がハイライトされる', async ({ topPage }) => {
    await topPage.goto()
    const engineerCard = topPage.categoryCard('プログラマ / ITエンジニア')
    const checkbox = topPage.categoryCheckbox('プログラマ / ITエンジニア')

    await expect(checkbox).not.toBeChecked()
    const before = await styleOf(engineerCard, 'background-color')

    await engineerCard.click()

    await expect(checkbox).toBeChecked()
    expect(await styleOf(engineerCard, 'background-color')).not.toBe(before)
  })

  test('カード選択時、タイトルと説明文の文字色が反転する', async ({ topPage }) => {
    await topPage.goto()

    const engineerCard = topPage.categoryCard('プログラマ / ITエンジニア')
    const title = engineerCard.locator('[data-slot="category-card-title"]')
    const description = engineerCard.locator('[data-slot="category-card-description"]')

    const titleBefore = await styleOf(title, 'color')
    const descriptionBefore = await styleOf(description, 'color')

    await engineerCard.click()

    expect(await styleOf(title, 'color')).not.toBe(titleBefore)
    expect(await styleOf(description, 'color')).not.toBe(descriptionBefore)
  })

  test('習熟度ボタン選択時、AnswerItemのlevel-buttonが実際にハイライトされる', async ({
    topPage,
    surveyPage,
  }) => {
    await topPage.goto()
    await topPage.submit()

    await surveyPage.checkAnswer('Slack')

    const level3 = surveyPage.levelRadio(3)
    await expect(level3).toHaveAttribute('data-state', 'unchecked')
    const before = await styleOf(level3, 'background-color')

    await surveyPage.selectLevel(3)

    await expect(level3).toHaveAttribute('data-state', 'checked')
    expect(await styleOf(level3, 'background-color')).not.toBe(before)
  })
})
