import { type Ref, nextTick, ref } from 'vue'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'

import { useGuestGate } from './useGuestGate'

describe('useGuestGate', () => {
  let containerRef: Ref<HTMLElement | null>

  beforeEach(() => {
    setActivePinia(createPinia())
    containerRef = ref(document.createElement('div'))
    document.body.appendChild(containerRef.value!)
  })

  afterEach(() => {
    containerRef.value?.remove()
  })

  // ─── isGuest ────────────────────────────────────────────────

  describe('isGuest', () => {
    it('userName が空の場合 true になる', () => {
      const { isGuest } = useGuestGate(containerRef)
      expect(isGuest.value).toBe(true)
    })

    it('userName が空白のみの場合も true になる（trim後で判定）', () => {
      const store = useSurveyStore()
      store.setUserName('   ')
      const { isGuest } = useGuestGate(containerRef)
      expect(isGuest.value).toBe(true)
    })

    it('userName が設定されている場合 false になる', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { isGuest } = useGuestGate(containerRef)
      expect(isGuest.value).toBe(false)
    })
  })

  // ─── guard ──────────────────────────────────────────────────

  describe('guard', () => {
    it('ゲスト時はツールチップを表示するのみで action は実行しない', () => {
      const { isTooltipVisible, guard } = useGuestGate(containerRef)
      const action = vi.fn()

      guard(action)

      expect(action).not.toHaveBeenCalled()
      expect(isTooltipVisible.value).toBe(true)
    })

    it('非ゲスト時は action を実行し、ツールチップは表示しない', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { isTooltipVisible, guard } = useGuestGate(containerRef)
      const action = vi.fn()

      guard(action)

      expect(action).toHaveBeenCalledOnce()
      expect(isTooltipVisible.value).toBe(false)
    })
  })

  // ─── handleMouseEnter / handleFocusIn ──────────────────────

  describe('handleMouseEnter / handleFocusIn', () => {
    it('ゲスト時、handleMouseEnter でツールチップが表示される', () => {
      const { isTooltipVisible, handleMouseEnter } = useGuestGate(containerRef)
      handleMouseEnter()
      expect(isTooltipVisible.value).toBe(true)
    })

    it('ゲスト時、handleFocusIn でツールチップが表示される', () => {
      const { isTooltipVisible, handleFocusIn } = useGuestGate(containerRef)
      handleFocusIn()
      expect(isTooltipVisible.value).toBe(true)
    })

    it('非ゲスト時は handleMouseEnter / handleFocusIn で何も起きない', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { isTooltipVisible, handleMouseEnter, handleFocusIn } = useGuestGate(containerRef)

      handleMouseEnter()
      expect(isTooltipVisible.value).toBe(false)

      handleFocusIn()
      expect(isTooltipVisible.value).toBe(false)
    })
  })

  // ─── handleMouseLeave / handleFocusOut（遅延） ───────────────

  describe('handleMouseLeave / handleFocusOut', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('150ms 経過後にツールチップが非表示になる', () => {
      const { isTooltipVisible, handleMouseEnter, handleMouseLeave } = useGuestGate(containerRef)
      handleMouseEnter()
      handleMouseLeave()

      expect(isTooltipVisible.value).toBe(true)
      vi.advanceTimersByTime(150)
      expect(isTooltipVisible.value).toBe(false)
    })

    it('handleFocusOut でも同様に150ms経過後に非表示になる', () => {
      const { isTooltipVisible, handleFocusIn, handleFocusOut } = useGuestGate(containerRef)
      handleFocusIn()
      handleFocusOut()

      expect(isTooltipVisible.value).toBe(true)
      vi.advanceTimersByTime(150)
      expect(isTooltipVisible.value).toBe(false)
    })

    it('遅延中に再度 handleMouseEnter が呼ばれるとタイマーがキャンセルされ非表示にならない', () => {
      const { isTooltipVisible, handleMouseEnter, handleMouseLeave } = useGuestGate(containerRef)
      handleMouseEnter()
      handleMouseLeave()
      vi.advanceTimersByTime(100)

      handleMouseEnter()
      vi.advanceTimersByTime(100)

      expect(isTooltipVisible.value).toBe(true)
    })

    it('非ゲスト時は handleMouseLeave で何も起きない', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { isTooltipVisible, handleMouseLeave } = useGuestGate(containerRef)

      handleMouseLeave()
      vi.advanceTimersByTime(150)

      expect(isTooltipVisible.value).toBe(false)
    })
  })

  // ─── goToNameInput ──────────────────────────────────────────

  it('goToNameInput は scrollTo を呼び、ツールチップを閉じる', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { isTooltipVisible, handleMouseEnter, goToNameInput } = useGuestGate(containerRef)
    handleMouseEnter()

    goToNameInput()

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(isTooltipVisible.value).toBe(false)
  })

  // ─── 外側クリック ──────────────────────────────────────────

  it('containerRef の外側をクリックするとツールチップが非表示になる', async () => {
    const { isTooltipVisible, handleMouseEnter } = useGuestGate(containerRef)
    handleMouseEnter()
    expect(isTooltipVisible.value).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(isTooltipVisible.value).toBe(false)
  })

  // ─── Escキー ────────────────────────────────────────────────

  describe('Escキー', () => {
    it('ツールチップ表示中に Esc キーで非表示になる', () => {
      const { isTooltipVisible, handleMouseEnter } = useGuestGate(containerRef)
      handleMouseEnter()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(isTooltipVisible.value).toBe(false)
    })

    it('ツールチップが非表示のときに Esc キーを押しても何も起きない', () => {
      const { isTooltipVisible } = useGuestGate(containerRef)

      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      }).not.toThrow()
      expect(isTooltipVisible.value).toBe(false)
    })
  })
})
