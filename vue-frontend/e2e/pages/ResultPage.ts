import type { Download, Locator, Page } from '@playwright/test'

import type { CategorySelection } from '@/types'

const STORAGE_KEY = 'survey'

export class ResultPage {
  readonly page: Page
  readonly heading: Locator
  readonly nameInput: Locator
  readonly shareButton: Locator
  readonly guestHint: Locator
  readonly buttonGroup: Locator
  readonly errorHeading: Locator

  constructor(page: Page) {
    this.page = page
    // 共有ビューの h2 と、通常ビューの EditableNameHeading 内にある視覚上非表示な
    // h2 は排他的に描画される。どちらも同じ見出し文言を持つ。
    this.heading = page.getByRole('heading', { name: /様のスキルシート/ })
    this.nameInput = page.getByRole('textbox', { name: /お名前/ })
    this.shareButton = page.getByRole('button', { name: '結果を印刷/共有' })
    // Reka の Tooltip は role="tooltip" を VisuallyHidden な span に付け、
    // そこに aria-hidden="true" も付ける。getByRole('tooltip') は既定の
    // includeHidden: false に弾かれて見つからないため、目に見える側を data-slot で取る。
    this.guestHint = page.locator('[data-slot="tooltip-content"]')
    this.buttonGroup = page.locator('[data-slot="result-actions"]')
    this.errorHeading = page.locator('[data-slot="state-panel-title"]')
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

  /**
   * ゲスト（名前未入力）状態の共有ボタンをクリックする。
   *
   * `AppButton` は `inactive` prop で `aria-disabled="true"` を付ける。
   * Playwright 1.60 の `getAriaDisabled()` はこれを無効と判定し、
   * `click()` のアクショナビリティ検査が `enabled` を待ち続けてタイムアウトする。
   * アプリ側は意図的にクリックを受けて名前入力欄へ誘導するため、force で検査を外す。
   */
  async clickShareButtonAsGuest(): Promise<void> {
    // eslint-disable-next-line playwright/no-force-option -- aria-disabled なボタンを意図的に押すため
    await this.shareButton.click({ force: true })
  }

  async downloadCsv(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download')
    await this.page.getByRole('menuitem', { name: 'CSVとして保存' }).click()
    return downloadPromise
  }

  async copyUrl(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'URLをコピー' }).click()
  }

  async print(): Promise<void> {
    await this.openShareMenu()
    await this.page.getByRole('menuitem', { name: '印刷する' }).click()
  }

  skillCard(index = 0): Locator {
    return this.page.locator('[data-slot="skill-card"]').nth(index)
  }

  /** 「名前を編集する」ボタンから再編集を開始する（committedフェーズ中のみ有効） */
  async startNameEdit(): Promise<void> {
    await this.page.getByRole('button', { name: '名前を編集する' }).click()
  }
}
