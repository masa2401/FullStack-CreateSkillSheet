import type { Download, Locator, Page } from '@playwright/test'

import type { CategorySelection } from '@/types'

const STORAGE_KEY = 'survey'

export class ResultPage {
  readonly page: Page
  readonly heading: Locator
  readonly nameInput: Locator
  readonly shareButton: Locator
  readonly buttonGroup: Locator
  readonly errorHeading: Locator

  constructor(page: Page) {
    this.page = page
    // 共有ビューでは.page-title、通常ビューではEditableNameHeading内の
    // 視覚上非表示な.user-name-heading（h2）が使われる。両者は排他的に描画される。
    this.heading = page.locator('.page-title, .user-name-heading')
    this.nameInput = page.locator('.page-title-input')
    this.shareButton = page.getByRole('button', { name: '結果を印刷/共有' })
    this.buttonGroup = page.locator('.button-group')
    this.errorHeading = page.locator('.error-title')
  }

  /** id= 経由（バックエンド連携）での共有ビュー表示 */
  async gotoWithId(id: string): Promise<void> {
    await this.page.goto(`/#/result?id=${id}`)
  }

  /** data= 経由（フロントエンド完結）での共有ビュー表示 */
  async gotoWithData(encoded: string): Promise<void> {
    await this.page.goto(`/#/result?data=${encoded}`)
  }

  /**
   * UI操作（Top→Survey→Resultのクリック）を経由せず、
   * ストアの状態を直接 localStorage に書き込んでからResultPageへ遷移する。
   * data=/id= と異なり通常ビュー（isSharedView: false）になるため、
   * ShareButton等の編集用UIが必要なテストではこちらを使う。
   */
  async seedAndGoto(state: { userName: string; selections: CategorySelection[] }): Promise<void> {
    const persisted = {
      userName: state.userName,
      selections: state.selections,
      savedSheetId: null,
      savedDataSnapshot: '',
    }

    await this.page.addInitScript(
      ({ key, value }) => {
        window.localStorage.setItem(key, value)
      },
      { key: STORAGE_KEY, value: JSON.stringify(persisted) },
    )
    await this.page.goto('/#/result')
  }

  /**
   * 名前入力→blur後、useNameCommitのconfirmDelayMs（既定2000ms）経過を待って確定させる。
   * 「名前を編集する」ボタンの出現（phase: committed）を確定の合図として待つ。
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name)
    await this.nameInput.blur()
    await this.page.getByRole('button', { name: '名前を編集する' }).waitFor({ state: 'visible' })
  }

  async openShareMenu(): Promise<void> {
    await this.shareButton.click()
    await this.page.getByRole('menu').waitFor({ state: 'visible' })
  }

  async downloadCsv(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download')
    await this.page.getByRole('button', { name: 'CSVとして保存' }).click()
    return downloadPromise
  }

  async copyUrl(): Promise<void> {
    await this.page.getByRole('button', { name: 'URLをコピー' }).click()
  }

  async print(): Promise<void> {
    await this.openShareMenu()
    await this.page.getByRole('button', { name: '印刷する' }).click()
  }

  skillCard(index = 0): Locator {
    return this.page.locator('.skill-card').nth(index)
  }

  /** 「名前を編集する」ボタンから再編集を開始する（committedフェーズ中のみ有効） */
  async startNameEdit(): Promise<void> {
    await this.page.getByRole('button', { name: '名前を編集する' }).click()
  }
}
