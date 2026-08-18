import type { Locator, Page } from '@playwright/test'

export class TopPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly startButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.getByLabel('お名前を入力してください')
    this.startButton = page.getByRole('button', { name: 'アンケートを開始' })
    this.errorMessage = page.getByRole('alert')
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name)
  }

  categoryCheckbox(categoryLabel: string): Locator {
    return this.page.getByRole('checkbox', { name: categoryLabel })
  }

  categoryCard(categoryLabel: string): Locator {
    return this.categoryCheckbox(categoryLabel).locator('..')
  }

  async selectCategory(categoryLabel: string): Promise<void> {
    await this.categoryCard(categoryLabel).click()
  }

  async submit(): Promise<void> {
    await this.startButton.click()
  }
}
