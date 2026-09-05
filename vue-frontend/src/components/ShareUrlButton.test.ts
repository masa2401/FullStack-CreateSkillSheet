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
import * as apiUtils from '@/utils/api'
import * as shareUtils from '@/utils/shareUtils'

import ShareUrlButton from './ShareUrlButton.vue'

const mockGetSavedIdOrSave = vi.fn()

vi.mock('@/stores/useSurveyStore', () => ({
  useSurveyStore: () => ({
    getSavedIdOrSave: mockGetSavedIdOrSave,
    surveyState: { userName: 'テストユーザー', selections: [] },
  }),
}))

const Host = defineComponent({
  components: { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, ShareUrlButton },
  emits: ['done'],
  template: `
    <DropdownMenu :open="true">
      <DropdownMenuTrigger>開く</DropdownMenuTrigger>
      <DropdownMenuContent>
        <ShareUrlButton @done="$emit('done')" />
      </DropdownMenuContent>
    </DropdownMenu>
  `,
})

const renderButton = () =>
  render(Host, {
    global: { plugins: [createTestingPinia()], stubs: { 'font-awesome-icon': true } },
  })

const findMenuItem = () => screen.findByRole('menuitem')

describe('ShareUrlButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(shareUtils, 'createShareUrl').mockReturnValue('https://example.com')
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
    mockGetSavedIdOrSave.mockResolvedValue('sheet-id-123')
  })

  // ─── 表示 ────────────────────────────────────────────────────

  it('初期状態では「URLをコピー」と表示される', async () => {
    renderButton()
    expect(await findMenuItem()).toHaveTextContent('URLをコピー')
  })

  it('初期状態では無効化されていない', async () => {
    renderButton()
    expect(await findMenuItem()).not.toHaveAttribute('data-disabled')
  })

  // ─── バックエンド無効時 ────────────────────────────────────────

  describe('バックエンド無効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
    })

    it('コピー成功時に success 用のクラスが付与される', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true)
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(await findMenuItem()).toHaveClass('text-emerald-700')
    })

    it('コピー成功時に createShareUrl が呼ばれる', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true)
      const createShareUrlSpy = vi.spyOn(shareUtils, 'createShareUrl')
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(createShareUrlSpy).toHaveBeenCalled()
    })

    it('コピー失敗時は success 用のクラスが付与されない', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(false)
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(await findMenuItem()).not.toHaveClass('text-emerald-700')
    })
  })

  // ─── バックエンド有効時 ────────────────────────────────────────

  describe('バックエンド有効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true)
    })

    it('getSavedIdOrSave が呼ばれる', async () => {
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(mockGetSavedIdOrSave).toHaveBeenCalled()
    })

    it('IDベースの URL がクリップボードへコピーされる', async () => {
      const copyToClipboardSpy = vi.spyOn(shareUtils, 'copyToClipboard')
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(copyToClipboardSpy).toHaveBeenCalledWith(expect.stringContaining('id=sheet-id-123'))
    })

    it('バックエンド失敗時は createShareUrl にフォールバックする', async () => {
      mockGetSavedIdOrSave.mockRejectedValue(new Error('保存に失敗しました'))
      const createShareUrlSpy = vi.spyOn(shareUtils, 'createShareUrl')
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(createShareUrlSpy).toHaveBeenCalled()
    })

    it('バックエンド失敗時もコピー完了表示になる', async () => {
      mockGetSavedIdOrSave.mockRejectedValue(new Error('保存に失敗しました'))
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      const menuItem = await findMenuItem()
      expect(menuItem).toHaveClass('text-emerald-700')
      expect(menuItem).toHaveTextContent('コピー完了')
    })
  })

  // ─── 多重送信抑制 ──────────────────────────────────────────────

  describe('多重送信の抑制', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true)
    })

    it('保存中は無効化される', async () => {
      mockGetSavedIdOrSave.mockReturnValue(new Promise(() => {}))
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(await findMenuItem()).toHaveAttribute('data-disabled')
    })

    it('保存中に再度クリックしても getSavedIdOrSave は1回しか呼ばれない', async () => {
      let resolveSave!: (value: string) => void
      mockGetSavedIdOrSave.mockReturnValue(
        new Promise<string>((resolve) => {
          resolveSave = resolve
        }),
      )
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())
      await user.click(await findMenuItem())

      resolveSave('sheet-id-123')

      expect(mockGetSavedIdOrSave).toHaveBeenCalledTimes(1)
    })

    it('保存完了後は無効化が解除される', async () => {
      const user = userEvent.setup()
      renderButton()

      await user.click(await findMenuItem())

      expect(await findMenuItem()).not.toHaveAttribute('data-disabled')
    })
  })

  // ─── 自動クローズ ──────────────────────────────────────────────

  describe('成功後の自動クローズ', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('コピー成功の2秒後に done イベントが emit される', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { emitted } = renderButton()

      await user.click(await findMenuItem())

      expect(emitted('done')).toBeUndefined()

      await vi.advanceTimersByTimeAsync(2000)

      expect(emitted('done')).toBeTruthy()
    })
  })
})
