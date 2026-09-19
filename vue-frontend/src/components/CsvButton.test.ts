import { defineComponent } from 'vue'

import { createTestingPinia } from '@pinia/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as csvUtils from '@/utils/csvUtils'

import CsvButton from './CsvButton.vue'

const Host = defineComponent({
  components: { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, CsvButton },
  emits: ['done'],
  template: `
    <DropdownMenu :open="true">
      <DropdownMenuTrigger>開く</DropdownMenuTrigger>
      <DropdownMenuContent>
        <CsvButton @done="$emit('done')" />
      </DropdownMenuContent>
    </DropdownMenu>
  `,
})

const renderButton = () =>
  render(Host, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            survey: { userName: 'テストユーザー', selections: [] },
          },
        }),
      ],
      stubs: { 'font-awesome-icon': true },
    },
  })

const findMenuItem = () => screen.findByRole('menuitem')

describe('CsvButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── 表示 ────────────────────────────────────────────────────

  it('初期状態では「CSVとして保存」と表示される', async () => {
    renderButton()
    expect(await findMenuItem()).toHaveTextContent('CSVとして保存')
  })

  it('初期状態では data-feedback が付かない', async () => {
    renderButton()
    expect(await findMenuItem()).not.toHaveAttribute('data-feedback')
  })

  // ─── ダウンロード成功 ──────────────────────────────────────────

  it('ダウンロード成功時に data-feedback が success になる', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true)
    const user = userEvent.setup()
    renderButton()

    await user.click(await findMenuItem())

    expect(await findMenuItem()).toHaveAttribute('data-feedback', 'success')
  })

  it('ダウンロード成功時に「ダウンロード完了」と表示される', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true)
    const user = userEvent.setup()
    renderButton()

    await user.click(await findMenuItem())

    expect(await findMenuItem()).toHaveTextContent('ダウンロード完了')
  })

  // ─── ダウンロード失敗 ──────────────────────────────────────────

  it('ダウンロード失敗時に data-feedback が error になる', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false)
    const user = userEvent.setup()
    renderButton()

    await user.click(await findMenuItem())

    expect(await findMenuItem()).toHaveAttribute('data-feedback', 'error')
  })

  it('ダウンロード失敗時に「保存に失敗しました」と表示される', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false)
    const user = userEvent.setup()
    renderButton()

    await user.click(await findMenuItem())

    expect(await findMenuItem()).toHaveTextContent('保存に失敗しました')
  })

  // ─── 自動クローズ ──────────────────────────────────────────────

  describe('成功後の自動クローズ', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('成功の2秒後に done イベントが emit される', async () => {
      vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true)
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { emitted } = renderButton()

      await user.click(await findMenuItem())

      expect(emitted('done')).toBeUndefined()

      await vi.advanceTimersByTimeAsync(2000)

      expect(emitted('done')).toBeTruthy()
    })

    it('失敗表示は2秒後に元の表示へ戻る', async () => {
      vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false)
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderButton()

      await user.click(await findMenuItem())
      expect(await findMenuItem()).toHaveAttribute('data-feedback', 'error')

      await vi.advanceTimersByTimeAsync(2000)

      expect(await findMenuItem()).not.toHaveAttribute('data-feedback')
      expect(await findMenuItem()).toHaveTextContent('CSVとして保存')
    })

    it('失敗時は done イベントが emit されない', async () => {
      vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false)
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { emitted } = renderButton()

      await user.click(await findMenuItem())
      await vi.advanceTimersByTimeAsync(2000)

      expect(emitted('done')).toBeUndefined()
    })
  })
})
