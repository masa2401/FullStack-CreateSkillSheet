import { type ComputedRef, computed } from 'vue'

import { useSurveyStore } from '@/stores/useSurveyStore'
import { getScrollBehavior } from '@/utils/motion'

export const GUEST_HINT_MESSAGE = 'お名前を入力すると、印刷・共有機能が利用できます'

const NAME_INPUT_SELECTOR = '[data-slot="name-input"]'

export interface UseGuestGateReturn {
  isGuest: ComputedRef<boolean>
  guard: (action: () => void) => void
  goToNameInput: () => void
}

export const useGuestGate = (): UseGuestGateReturn => {
  const store = useSurveyStore()
  const isGuest = computed<boolean>(() => !store.userName.trim())

  const goToNameInput = (): void => {
    document.querySelector<HTMLInputElement>(NAME_INPUT_SELECTOR)?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: getScrollBehavior() })
  }

  const guard = (action: () => void): void => {
    if (isGuest.value) {
      goToNameInput()
      return
    }
    action()
  }

  return {
    isGuest,
    guard,
    goToNameInput,
  }
}
