import type { Locator, Page } from '@playwright/test'

import type { StarLevel } from '@/types'

export class SurveyPage {
  readonly page: Page
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly noAnswersMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.submitButton = page.getByRole('button', { name: '次へ進む' })
    this.errorMessage = page.locator('#error-message')
    this.noAnswersMessage = page.locator('#no-answers-message')
  }

  answerCheckbox(label: string): Locator {
    return this.page.getByRole('checkbox', { name: label })
  }

  /**
   * 習熟度のラジオ。`src/components/AnswerItem.vue` の `RadioGroupItem` が
   * `aria-label="習熟度 3: 期待どおりにできる"` の形で名前を持つため、前方一致で拾う。
   */
  levelRadio(level: StarLevel): Locator {
    return this.page.getByRole('radio', { name: new RegExp(`^習熟度 ${level}:`) }).first()
  }

  async checkAnswer(label: string): Promise<void> {
    await this.answerCheckbox(label).check()
  }

  async selectLevel(level: StarLevel): Promise<void> {
    await this.levelRadio(level).click()
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
