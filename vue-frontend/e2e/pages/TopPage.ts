import type { Locator, Page } from '@playwright/test'

export class TopPage {
  readonly page: Page
  readonly startButton: Locator

  constructor(page: Page) {
    this.page = page
    this.startButton = page.getByRole('button', { name: 'アンケートを開始' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  categoryCheckbox(categoryLabel: string): Locator {
    return this.page.getByRole('checkbox', { name: categoryLabel })
  }

  categoryCard(categoryLabel: string): Locator {
    return this.page
      .locator('[data-slot="category-card"]')
      .filter({ has: this.categoryCheckbox(categoryLabel) })
  }

  async selectCategory(categoryLabel: string): Promise<void> {
    await this.categoryCard(categoryLabel).click()
  }

  async submit(): Promise<void> {
    await this.startButton.click()
  }
}
