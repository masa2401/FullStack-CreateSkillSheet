import { nextTick } from 'vue'

import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore.ts'
import * as apiUtils from '@/utils/api'

import MenuItemButton from './MenuItemButton.vue'
import ShareButton from './ShareButton.vue'

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
        AnimatedIconButton: {
          name: 'AnimatedIconButton',
          template: '<button @click="$emit(\'click\')"><slot /></button>',
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

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
  })

  it('初期状態ではメニューが非表示', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('ボタンクリックでメニューが表示される', async () => {
    const wrapper = createWrapper()
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
  })

  it('メニューを再度クリックすると閉じる', async () => {
    const wrapper = createWrapper()
    const button = wrapper.findComponent({ name: 'AnimatedIconButton' })
    await button.trigger('click')
    await button.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('ShareUrlButton と CsvButton がメニュー内に表示される', async () => {
    const wrapper = createWrapper()
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    expect(wrapper.find('.share-url-button-stub').exists()).toBe(true)
    expect(wrapper.find('.csv-button-stub').exists()).toBe(true)
  })

  it('done イベントを受け取るとメニューが閉じる', async () => {
    const wrapper = createWrapper()
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.findComponent({ name: 'ShareUrlButton' }).vm.$emit('done')
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  // ─── バックエンド無効時 ─────────────────────────────────

  it('バックエンド無効時は PdfButton が表示されない', async () => {
    const wrapper = createWrapper()
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    expect(wrapper.find('.pdf-button-stub').exists()).toBe(false)
  })

  // ─── バックエンド有効時 ─────────────────────────────────

  describe('バックエンド有効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    })

    it('PdfButton がメニュー内に表示される', async () => {
      const wrapper = createWrapper()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
      expect(wrapper.find('.pdf-button-stub').exists()).toBe(true)
    })

    it('メニューを開くと getSavedIdOrSave が呼ばれる', async () => {
      const wrapper = createWrapper()
      const store = useSurveyStore()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
      await flushPromises()
      expect(store.getSavedIdOrSave).toHaveBeenCalledOnce()
    })

    it('既に savedSheetId がある場合でも getSavedIdOrSave は呼ばれる', async () => {
      const wrapper = createWrapper({ savedSheetId: 'already-saved-id' })
      const store = useSurveyStore()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
      await flushPromises()
      expect(store.getSavedIdOrSave).toHaveBeenCalled()
    })

    it('保存に失敗してもメニュー表示は維持される', async () => {
      const wrapper = createWrapper()
      const store = useSurveyStore()
      vi.mocked(store.getSavedIdOrSave).mockRejectedValue(new Error('保存に失敗しました'))
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
      await flushPromises()
      expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    })
  })

  // ─── GuestGate ─────────────────────────────────────
  describe('GuestGate', () => {
    it('クリックしてもメニューは開かず、代わりにツールチップが表示される', async () => {
      const wrapper = createWrapper({ userName: '' })
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
      expect(wrapper.find('.guest-tooltip').exists()).toBe(true)
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

    describe('ホバー・フォーカスでのツールチップ表示（フェイクタイマー）', () => {
      beforeEach(() => vi.useFakeTimers())
      afterEach(() => vi.useRealTimers())

      it('mouseenter でツールチップが表示され、mouseleave 後にタイマー経過で非表示になる', async () => {
        const wrapper = createWrapper({ userName: '' })
        await wrapper.trigger('mouseenter')
        expect(wrapper.find('.guest-tooltip').exists()).toBe(true)

        await wrapper.trigger('mouseleave')
        vi.advanceTimersByTime(150)
        await nextTick()
        expect(wrapper.find('.guest-tooltip').exists()).toBe(false)
      })

      it('focusin でツールチップが表示され、focusout 後にタイマー経過で非表示になる', async () => {
        const wrapper = createWrapper({ userName: '' })
        await wrapper.trigger('focusin')
        expect(wrapper.find('.guest-tooltip').exists()).toBe(true)

        await wrapper.trigger('focusout')
        vi.advanceTimersByTime(150)
        await nextTick()
        expect(wrapper.find('.guest-tooltip').exists()).toBe(false)
      })
    })

    it('「お名前を入力する」クリックで scrollTo が呼ばれ、ツールチップが閉じる', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const wrapper = createWrapper({ userName: '' })
      await wrapper.trigger('mouseenter')

      await wrapper.find('.guest-tooltip-link').trigger('click')

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      expect(wrapper.find('.guest-tooltip').exists()).toBe(false)
    })

    it('外側クリックでツールチップが閉じる', async () => {
      const wrapper = createWrapper({ userName: '' })
      await wrapper.trigger('mouseenter')
      expect(wrapper.find('.guest-tooltip').exists()).toBe(true)

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(wrapper.find('.guest-tooltip').exists()).toBe(false)
    })

    it('Esc キーでツールチップが閉じる', async () => {
      const wrapper = createWrapper({ userName: '' })
      await wrapper.trigger('mouseenter')

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()

      expect(wrapper.find('.guest-tooltip').exists()).toBe(false)
    })
  })

  // ─── 印刷メニュー統合（旧 PrintButton.vue 相当） ─────────────────────

  describe('印刷メニュー統合', () => {
    it('メニュー内に「印刷する」が表示される', async () => {
      const wrapper = createWrapper()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')

      const printItem = wrapper.findComponent(MenuItemButton)
      expect(printItem.exists()).toBe(true)
      expect(printItem.props('text')).toBe('印刷する')
      expect(printItem.props('icon')).toBe('fa-solid fa-print')
    })

    it('「印刷する」クリックで window.print が呼ばれ、メニューが閉じる', async () => {
      const printSpy = vi.fn()
      window.print = printSpy
      const wrapper = createWrapper()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')

      await wrapper.findComponent(MenuItemButton).trigger('click')

      expect(printSpy).toHaveBeenCalledOnce()
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })
  })

  // ─── 共有メニュー自体の外側クリック/Esc対応 ─────────────────────────

  describe('共有メニューの外側クリック/Esc対応', () => {
    it('メニュー表示中に外側クリックで閉じる', async () => {
      const wrapper = createWrapper()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
      expect(wrapper.find('[role="menu"]').exists()).toBe(true)

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })

    it('メニュー表示中に Esc キーで閉じる', async () => {
      const wrapper = createWrapper()
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()

      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })

    it('ゲスト状態でツールチップ表示中に、メニューが誤って開閉しない', async () => {
      const wrapper = createWrapper({ userName: '' })
      await wrapper.trigger('mouseenter')
      expect(wrapper.find('.guest-tooltip').exists()).toBe(true)
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })
  })
})
