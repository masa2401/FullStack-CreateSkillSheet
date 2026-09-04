import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'

import { useGuestGate } from './useGuestGate'

/**
 * jsdom は `window.matchMedia` を実装していない（happy-dom は実装済み）。
 * `src/utils/motion.ts` の `getScrollBehavior()` は呼び出しのたびに評価するので、
 * テストごとに差し替えれば足りる。
 */
const stubMatchMedia = (prefersReducedMotion: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: prefersReducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  )
}

/** `src/components/EditableNameHeading.vue` の入力欄を模した要素を DOM に置く */
const mountNameInput = (): HTMLInputElement => {
  const input = document.createElement('input')
  input.setAttribute('data-slot', 'name-input')
  document.body.appendChild(input)
  return input
}

describe('useGuestGate', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  // ─── isGuest ────────────────────────────────────────────────

  describe('isGuest', () => {
    it('userName が空の場合 true になる', () => {
      const { isGuest } = useGuestGate()
      expect(isGuest.value).toBe(true)
    })

    it('userName が空白のみの場合も true になる（trim後で判定）', () => {
      const store = useSurveyStore()
      store.setUserName('   ')
      const { isGuest } = useGuestGate()
      expect(isGuest.value).toBe(true)
    })

    it('userName が設定されている場合 false になる', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { isGuest } = useGuestGate()
      expect(isGuest.value).toBe(false)
    })
  })

  // ─── goToNameInput ──────────────────────────────────────────

  describe('goToNameInput', () => {
    it('name-input へ preventScroll 付きでフォーカスする', () => {
      const input = mountNameInput()
      const focusSpy = vi.spyOn(input, 'focus')
      const { goToNameInput } = useGuestGate()

      goToNameInput()

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    })

    it('ページ最上部へスクロールする', () => {
      mountNameInput()
      const { goToNameInput } = useGuestGate()

      goToNameInput()

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('name-input が存在しなくても例外にならず、スクロールは行われる', () => {
      const { goToNameInput } = useGuestGate()

      expect(() => goToNameInput()).not.toThrow()
      expect(scrollToSpy).toHaveBeenCalledOnce()
    })
  })

  // ─── スクロール挙動（prefers-reduced-motion） ───────────────

  describe('スクロール挙動', () => {
    it('モーション低減が有効な場合は behavior が auto になる', () => {
      stubMatchMedia(true)
      const { goToNameInput } = useGuestGate()

      goToNameInput()

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    })

    it('モーション低減が無効な場合は behavior が smooth になる', () => {
      stubMatchMedia(false)
      const { goToNameInput } = useGuestGate()

      goToNameInput()

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('matchMedia が未実装の環境でも behavior は smooth になる', () => {
      vi.stubGlobal('matchMedia', undefined)
      const { goToNameInput } = useGuestGate()

      goToNameInput()

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })

  // ─── guard ──────────────────────────────────────────────────

  describe('guard', () => {
    it('ゲスト時は action を実行せず、名前入力欄へ誘導する', () => {
      const input = mountNameInput()
      const focusSpy = vi.spyOn(input, 'focus')
      const { guard } = useGuestGate()
      const action = vi.fn()

      guard(action)

      expect(action).not.toHaveBeenCalled()
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('非ゲスト時は action を実行し、スクロールは起きない', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { guard } = useGuestGate()
      const action = vi.fn()

      guard(action)

      expect(action).toHaveBeenCalledOnce()
      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })
})
