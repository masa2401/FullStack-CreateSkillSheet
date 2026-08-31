import { nextTick, ref } from 'vue'

import { createTestingPinia } from '@pinia/testing'
import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore.ts'
import * as apiUtils from '@/utils/api'

import MenuItemButton from './MenuItemButton.vue'
import ShareButton from './ShareButton.vue'

// ポーリングは ShareButton 側で開始されるため、テストでは常に止めておく
vi.mock('@/composables/usePdfStatus', () => ({
  usePdfStatus: () => ({
    state: ref('waiting'),
    downloadUrl: ref(''),
    progress: ref(0),
    retry: vi.fn(),
  }),
}))

const passThroughStub = (name: string, props: string[] = []) => ({
  name,
  props,
  template: '<div><slot /></div>',
})

const createWrapper = (initialState: Record<string, unknown> = {}) =>
  mount(ShareButton, {
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
        DropdownMenu: passThroughStub('DropdownMenu', ['open']),
        DropdownMenuTrigger: passThroughStub('DropdownMenuTrigger'),
        DropdownMenuContent: {
          name: 'DropdownMenuContent',
          template: '<div role="menu"><slot /></div>',
        },
        Tooltip: passThroughStub('Tooltip', ['disabled']),
        TooltipTrigger: passThroughStub('TooltipTrigger'),
        TooltipContent: passThroughStub('TooltipContent'),
        AnimatedIconButton: {
          name: 'AnimatedIconButton',
          props: ['inactive'],
          template: '<button :aria-disabled="String(!!inactive)" />',
        },
        MenuItemButton: {
          name: 'MenuItemButton',
          props: ['icon', 'text', 'variant', 'spin', 'disabled', 'closeOnSelect'],
          template: '<button @click="$emit(\'click\')">{{ text }}</button>',
          emits: ['click'],
        },
        ShareUrlButton: {
          name: 'ShareUrlButton',
          template: '<div class="share-url-button-stub" />',
          emits: ['done'],
        },
        CsvButton: {
          name: 'CsvButton',
          template: '<div class="csv-button-stub" />',
          emits: ['done'],
        },
        PdfButton: {
          name: 'PdfButton',
          template: '<div class="pdf-button-stub" />',
          emits: ['done'],
        },
      },
    },
  })

/** DropdownMenu からの開閉要求を模す */
const requestOpen = async (wrapper: VueWrapper, open: boolean) => {
  wrapper.findComponent({ name: 'DropdownMenu' }).vm.$emit('update:open', open)
  await nextTick()
}

const isOpen = (wrapper: VueWrapper): boolean =>
  wrapper.findComponent({ name: 'DropdownMenu' }).props('open') as boolean

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
  })

  it('初期状態ではメニューが閉じている', () => {
    const wrapper = createWrapper()
    expect(isOpen(wrapper)).toBe(false)
  })

  it('開閉要求でメニューの開閉状態が切り替わる', async () => {
    const wrapper = createWrapper()

    await requestOpen(wrapper, true)
    expect(isOpen(wrapper)).toBe(true)

    await requestOpen(wrapper, false)
    expect(isOpen(wrapper)).toBe(false)
  })

  it('ShareUrlButton と CsvButton がメニュー内に描画される', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.share-url-button-stub').exists()).toBe(true)
    expect(wrapper.find('.csv-button-stub').exists()).toBe(true)
  })

  it('done イベントを受け取るとメニューが閉じる', async () => {
    const wrapper = createWrapper()
    await requestOpen(wrapper, true)

    wrapper.findComponent({ name: 'ShareUrlButton' }).vm.$emit('done')
    await nextTick()

    expect(isOpen(wrapper)).toBe(false)
  })

  // ─── バックエンド無効時 ─────────────────────────────────

  it('バックエンド無効時は PdfButton が描画されない', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.pdf-button-stub').exists()).toBe(false)
  })

  // ─── バックエンド有効時 ─────────────────────────────────

  describe('バックエンド有効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    })

    it('PdfButton がメニュー内に描画される', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.pdf-button-stub').exists()).toBe(true)
    })

    it('メニューを開くと getSavedIdOrSave が呼ばれる', async () => {
      const wrapper = createWrapper()
      const store = useSurveyStore()
      await requestOpen(wrapper, true)
      await flushPromises()
      expect(store.getSavedIdOrSave).toHaveBeenCalledOnce()
    })

    it('既に savedSheetId がある場合でも getSavedIdOrSave は呼ばれる', async () => {
      const wrapper = createWrapper({ savedSheetId: 'already-saved-id' })
      const store = useSurveyStore()
      await requestOpen(wrapper, true)
      await flushPromises()
      expect(store.getSavedIdOrSave).toHaveBeenCalled()
    })

    it('保存に失敗してもメニューは開いたままになる', async () => {
      const wrapper = createWrapper()
      const store = useSurveyStore()
      vi.mocked(store.getSavedIdOrSave).mockRejectedValue(new Error('保存に失敗しました'))
      await requestOpen(wrapper, true)
      await flushPromises()
      expect(isOpen(wrapper)).toBe(true)
    })
  })

  // ─── GuestGate ─────────────────────────────────────

  describe('GuestGate', () => {
    it('ゲスト時は DropdownMenu を描画せず、Tooltip 付きのボタンだけを出す', () => {
      const wrapper = createWrapper({ userName: '' })
      expect(wrapper.findComponent({ name: 'DropdownMenu' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'Tooltip' }).exists()).toBe(true)
    })

    it('非ゲスト時は Tooltip を描画せず、DropdownMenu を出す', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'Tooltip' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'DropdownMenu' }).exists()).toBe(true)
    })

    it('ゲスト時はボタンクリックで名前入力欄へスクロールする', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const wrapper = createWrapper({ userName: '' })

      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('ボタンに aria-disabled="true" が付与される（非ゲスト時は付与されない）', () => {
      const guestWrapper = createWrapper({ userName: '' })
      expect(
        guestWrapper.findComponent({ name: 'AnimatedIconButton' }).attributes('aria-disabled'),
      ).toBe('true')

      const wrapper = createWrapper()
      expect(
        wrapper.findComponent({ name: 'AnimatedIconButton' }).attributes('aria-disabled'),
      ).toBe('false')
    })
  })

  // ─── 印刷メニュー統合（旧 PrintButton.vue 相当） ─────────────────────

  describe('印刷メニュー統合', () => {
    it('メニュー内に「印刷する」が表示される', () => {
      const wrapper = createWrapper()

      const printItem = wrapper.findComponent(MenuItemButton)
      expect(printItem.exists()).toBe(true)
      expect(printItem.props('text')).toBe('印刷する')
      expect(printItem.props('icon')).toBe('fa-solid fa-print')
    })

    it('「印刷する」の選択で window.print が呼ばれる', async () => {
      const printSpy = vi.fn()
      window.print = printSpy
      const wrapper = createWrapper()

      await wrapper.findComponent(MenuItemButton).trigger('click')

      expect(printSpy).toHaveBeenCalledOnce()
    })
  })
})
