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

  levelRadio(level: StarLevel): Locator {
    return this.page.getByRole('radio', { name: `${level}段階` }).first()
  }

  async checkAnswer(label: string): Promise<void> {
    await this.answerCheckbox(label).check()
  }

  async selectLevel(level: StarLevel): Promise<void> {
    await this.levelRadio(level).locator('..').click()
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
