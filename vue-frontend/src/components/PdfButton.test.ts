import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import type { PdfGenerationState } from '@/composables/usePdfStatus'

import PdfButton from './PdfButton.vue'

/**
 * `MenuItemButton` は `DropdownMenuItem` 由来で `MenuRoot` のコンテキストを要求する。
 * ここで検証したいのは state から表示・変種・可否への対応付けなので、
 * 受け取った props を DOM 属性として出すクリック駆動のスタブへ差し替える。
 *
 * `disabled` をネイティブの `disabled` として出すとクリック自体が届かなくなり、
 * `PdfButton` 側のガードを検証できないため `data-disabled` として出す。
 */
const MENU_ITEM_STUB = {
  props: {
    icon: String,
    text: String,
    variant: String,
    spin: Boolean,
    disabled: Boolean,
    closeOnSelect: Boolean,
  },
  emits: ['click'],
  template: `<button
      :data-variant="variant"
      :data-disabled="disabled || undefined"
      @click="$emit('click')"
    >{{ text }}<slot /></button>`,
}

const renderPdfButton = (state: PdfGenerationState, progress = 0) =>
  render(PdfButton, {
    props: { state, progress },
    global: { stubs: { MenuItemButton: MENU_ITEM_STUB } },
  })

const menuItem = () => screen.getByRole('button')

const progressBar = () => screen.queryByRole('progressbar', { name: 'PDFの生成状況' })

describe('PdfButton', () => {
  // ─── 生成中 ─────────────────────────────────────

  it('generating 状態では「PDFを準備中...」と進捗バーが表示され、選択できない', () => {
    renderPdfButton('generating', 42)

    expect(menuItem()).toHaveTextContent('PDFを準備中...')
    expect(progressBar()).toHaveAttribute('aria-valuenow', '42')
    expect(menuItem()).toHaveAttribute('data-disabled')
  })

  it('slow 状態では文言が切り替わり、バーは表示されたままになる', () => {
    renderPdfButton('slow', 100)

    expect(menuItem()).toHaveTextContent('PDF処理に時間がかかっています...')
    expect(progressBar()).toBeInTheDocument()
  })

  it('生成中にクリックしても download / retry は emit されない', async () => {
    const user = userEvent.setup()
    const { emitted } = renderPdfButton('generating', 10)

    await user.click(menuItem())

    expect(emitted().download).toBeFalsy()
    expect(emitted().retry).toBeFalsy()
  })

  // ─── 完了 ───────────────────────────────────────

  it('ready 状態では「PDFをダウンロード」と表示され、バーは消える', () => {
    renderPdfButton('ready')

    expect(menuItem()).toHaveTextContent('PDFをダウンロード')
    expect(progressBar()).not.toBeInTheDocument()
    expect(menuItem()).toHaveAttribute('data-variant', 'success')
    expect(menuItem()).not.toHaveAttribute('data-disabled')
  })

  it('ready 状態でクリックすると download が emit される', async () => {
    const user = userEvent.setup()
    const { emitted } = renderPdfButton('ready')

    await user.click(menuItem())

    expect(emitted().download).toBeTruthy()
  })

  // ─── 失敗 ───────────────────────────────────────

  it('error 状態では再試行の文言になり、バーは消える', () => {
    renderPdfButton('error')

    expect(menuItem()).toHaveTextContent('PDF生成に失敗（再試行）')
    expect(progressBar()).not.toBeInTheDocument()
    expect(menuItem()).toHaveAttribute('data-variant', 'error')
  })

  it('error 状態でクリックすると retry が emit される', async () => {
    const user = userEvent.setup()
    const { emitted } = renderPdfButton('error')

    await user.click(menuItem())

    expect(emitted().retry).toBeTruthy()
  })
})
