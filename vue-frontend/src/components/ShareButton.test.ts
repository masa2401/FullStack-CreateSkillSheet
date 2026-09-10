import { type InjectionKey, type Ref, defineComponent, inject, provide, ref, toRef } from 'vue'

import { createTestingPinia } from '@pinia/testing'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore.ts'
import * as apiUtils from '@/utils/api'

import ShareButton from './ShareButton.vue'

vi.mock('@/composables/usePdfStatus', () => ({
  usePdfStatus: () => ({
    state: ref('waiting'),
    downloadUrl: ref(''),
    progress: ref(0),
    retry: vi.fn(),
  }),
}))

/**
 * このテストが見るのは `ShareButton` 自身の状態遷移と配線だけ。
 * Reka UI が実際に開くか、Portal されるか、`as-child` の入れ子が成立するか、
 * ツールチップがホバーで出るかは見た目・実挙動なので e2e（`e2e/share.spec.ts`）の担当。
 *
 * ただし開閉状態を prop から覗くのは避け、`open` を受けて
 * メニューの中身を出し分けるスタブにして DOM で観測できるようにしている。
 */
const MENU_OPEN: InjectionKey<Ref<boolean>> = Symbol('menu-open')
const MENU_REQUEST_OPEN: InjectionKey<(open: boolean) => void> = Symbol('menu-request-open')

const DROPDOWN_MENU_STUB = defineComponent({
  props: { open: Boolean },
  emits: ['update:open'],
  setup(props, { emit }) {
    provide(MENU_OPEN, toRef(props, 'open'))
    provide(MENU_REQUEST_OPEN, (open: boolean) => emit('update:open', open))
  },
  template: '<div><slot /></div>',
})

const DROPDOWN_MENU_TRIGGER_STUB = defineComponent({
  setup() {
    const isOpen = inject(MENU_OPEN, ref(false))
    const requestOpen = inject(MENU_REQUEST_OPEN, () => {})
    return { toggle: () => requestOpen(!isOpen.value) }
  },
  template: '<div @click="toggle"><slot /></div>',
})

const DROPDOWN_MENU_CONTENT_STUB = defineComponent({
  inheritAttrs: false,
  setup() {
    return { isOpen: inject(MENU_OPEN, ref(false)) }
  },
  template: '<div v-if="isOpen" role="menu"><slot /></div>',
})

const PASS_THROUGH_STUB = { template: '<div><slot /></div>' }

const MENU_ITEM_STUB = defineComponent({
  props: { icon: String, text: String },
  emits: ['click'],
  template: '<button type="button" @click="$emit(\'click\')">{{ text }}</button>',
})

/** 子ボタンは自前のテストを持つ。ここでは在席と done を返せることだけ分かればよい */
const doneButtonStub = (label: string) =>
  defineComponent({
    emits: ['done'],
    template: `<button type="button" @click="$emit('done')">${label}</button>`,
  })

const renderShareButton = (initialState: Record<string, unknown> = {}) =>
  render(ShareButton, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            survey: { saveSheetId: null, userName: 'テストユーザー', ...initialState },
          },
        }),
      ],
      stubs: {
        'font-awesome-icon': true,
        DropdownMenu: DROPDOWN_MENU_STUB,
        DropdownMenuTrigger: DROPDOWN_MENU_TRIGGER_STUB,
        DropdownMenuContent: DROPDOWN_MENU_CONTENT_STUB,
        Tooltip: PASS_THROUGH_STUB,
        TooltipTrigger: PASS_THROUGH_STUB,
        TooltipContent: PASS_THROUGH_STUB,
        MenuItemButton: MENU_ITEM_STUB,
        CsvButton: doneButtonStub('CSVボタン'),
        ShareUrlButton: doneButtonStub('共有URLボタン'),
        PdfButton: doneButtonStub('PDFボタン'),
      },
    },
  })

const shareTrigger = () => screen.getByRole('button', { name: '結果を印刷/共有' })

const menu = () => screen.queryByRole('menu')

describe('ShareButton', () => {
  beforeEach(() => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
  })

  it('初期状態ではメニューが閉じている', () => {
    renderShareButton()
    expect(menu()).not.toBeInTheDocument()
  })

  it('トリガーの操作でメニューの開閉状態が切り替わる', async () => {
    const user = userEvent.setup()
    renderShareButton()

    await user.click(shareTrigger())
    expect(menu()).toBeInTheDocument()

    await user.click(shareTrigger())
    expect(menu()).not.toBeInTheDocument()
  })

  it('ShareUrlButton と CsvButton がメニュー内に描画される', async () => {
    const user = userEvent.setup()
    renderShareButton()

    await user.click(shareTrigger())

    expect(screen.getByRole('button', { name: 'CSVボタン' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '共有URLボタン' })).toBeInTheDocument()
  })

  it('done イベントを受け取るとメニューが閉じる', async () => {
    const user = userEvent.setup()
    renderShareButton()
    await user.click(shareTrigger())

    await user.click(screen.getByRole('button', { name: '共有URLボタン' }))

    expect(menu()).not.toBeInTheDocument()
  })

  // ─── バックエンド無効時 ─────────────────────────────────

  it('バックエンド無効時は PdfButton が描画されない', async () => {
    const user = userEvent.setup()
    renderShareButton()

    await user.click(shareTrigger())

    expect(screen.queryByRole('button', { name: 'PDFボタン' })).not.toBeInTheDocument()
  })

  // ─── バックエンド有効時 ─────────────────────────────────

  describe('バックエンド有効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    })

    it('PdfButton がメニュー内に描画される', async () => {
      const user = userEvent.setup()
      renderShareButton()

      await user.click(shareTrigger())

      expect(screen.getByRole('button', { name: 'PDFボタン' })).toBeInTheDocument()
    })

    it('メニューを開くと getSavedIdOrSave が呼ばれる', async () => {
      const user = userEvent.setup()
      renderShareButton()
      const store = useSurveyStore()

      await user.click(shareTrigger())

      await waitFor(() => expect(store.getSavedIdOrSave).toHaveBeenCalledOnce())
    })

    it('既に savedSheetId がある場合でも getSavedIdOrSave は呼ばれる', async () => {
      const user = userEvent.setup()
      renderShareButton({ savedSheetId: 'already-saved-id' })
      const store = useSurveyStore()

      await user.click(shareTrigger())

      await waitFor(() => expect(store.getSavedIdOrSave).toHaveBeenCalled())
    })

    it('保存に失敗してもメニューは開いたままになる', async () => {
      const user = userEvent.setup()
      renderShareButton()
      const store = useSurveyStore()
      vi.mocked(store.getSavedIdOrSave).mockRejectedValue(new Error('保存に失敗しました'))

      await user.click(shareTrigger())

      await waitFor(() => expect(store.getSavedIdOrSave).toHaveBeenCalled())
      expect(menu()).toBeInTheDocument()
    })
  })

  // ─── GuestGate ─────────────────────────────────────

  describe('GuestGate', () => {
    it('ゲスト時はトリガーを押してもメニューが開かない', async () => {
      const user = userEvent.setup()
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      renderShareButton({ userName: '' })

      await user.click(shareTrigger())

      expect(menu()).not.toBeInTheDocument()
    })

    it('非ゲスト時はトリガーでメニューが開く', async () => {
      const user = userEvent.setup()
      renderShareButton()

      await user.click(shareTrigger())

      expect(menu()).toBeInTheDocument()
    })

    it('ゲスト時はボタンクリックで名前入力欄へスクロールする', async () => {
      const user = userEvent.setup()
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      renderShareButton({ userName: '' })

      await user.click(shareTrigger())

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('ボタンに aria-disabled="true" が付与される（非ゲスト時は付与されない）', () => {
      const { unmount } = renderShareButton({ userName: '' })
      expect(shareTrigger()).toHaveAttribute('aria-disabled', 'true')
      unmount()

      renderShareButton()
      expect(shareTrigger()).toHaveAttribute('aria-disabled', 'false')
    })
  })

  // ─── 印刷メニュー統合（旧 PrintButton.vue 相当） ─────────────────────

  describe('印刷メニュー統合', () => {
    it('メニュー内に「印刷する」が表示される', async () => {
      const user = userEvent.setup()
      renderShareButton()

      await user.click(shareTrigger())

      expect(screen.getByRole('button', { name: '印刷する' })).toBeInTheDocument()
    })

    it('「印刷する」の選択で window.print が呼ばれる', async () => {
      const user = userEvent.setup()
      const printSpy = vi.fn()
      window.print = printSpy
      renderShareButton()
      await user.click(shareTrigger())

      await user.click(screen.getByRole('button', { name: '印刷する' }))

      expect(printSpy).toHaveBeenCalledOnce()
    })
  })
})
