import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'

import { useGuestGate } from './useGuestGate'

describe('useGuestGate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

  // ─── guard ──────────────────────────────────────────────────

  describe('guard', () => {
    it('ゲスト時は action を実行せず、名前入力欄へ誘導する', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const { guard } = useGuestGate()
      const action = vi.fn()

      guard(action)

      expect(action).not.toHaveBeenCalled()
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('非ゲスト時は action を実行し、スクロールは起きない', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      const { guard } = useGuestGate()
      const action = vi.fn()

      guard(action)

      expect(action).toHaveBeenCalledOnce()
      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })

  // ─── goToNameInput ──────────────────────────────────────────

  describe('goToNameInput', () => {
    it('入力欄が存在する場合、一時的にハイライトクラスが付与され、時間経過で外れる', () => {
      vi.useFakeTimers()
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

      const input = document.createElement('input')
      input.className = 'page-title-input'
      document.body.appendChild(input)

      const { goToNameInput } = useGuestGate()
      goToNameInput()

      expect(input.classList.contains('is-highlighted')).toBe(true)
      vi.advanceTimersByTime(1500)
      expect(input.classList.contains('is-highlighted')).toBe(false)

      vi.useRealTimers()
    })

    it('入力欄が存在しなくてもエラーにならない', () => {
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const { goToNameInput } = useGuestGate()

      expect(() => goToNameInput()).not.toThrow()
    })
  })
})
