import { type ComputedRef, computed } from 'vue'

import { useSurveyStore } from '@/stores/useSurveyStore'

export const GUEST_HINT_MESSAGE = 'お名前を入力すると、印刷・共有機能が利用できます'

const NAME_INPUT_SELECTOR = '.page-title-input'
const HIGHLIGHT_CLASS = 'is-highlighted'
const HIGHLIGHT_DURATION_MS = 1500

export interface UseGuestGateReturn {
  isGuest: ComputedRef<boolean>
  /** ゲストなら名前入力欄へ誘導するだけにし、そうでなければactionを実行する */
  guard: (action: () => void) => void
  /** 名前入力欄へスクロールし、一時的にハイライトする */
  goToNameInput: () => void
}

/**
 * 名前未入力時に印刷・共有ボタンを見た目上グレーアウトしつつ、
 * 押されたら名前入力欄へ誘導するための共通ロジック。
 *
 * 「なぜ押せないか」の提示は Reka UI の Tooltip に委譲するため、
 * ここでは表示状態を一切持たない。
 */
export const useGuestGate = (): UseGuestGateReturn => {
  const store = useSurveyStore()
  const isGuest = computed<boolean>(() => !store.userName.trim())

  const goToNameInput = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const input = document.querySelector<HTMLElement>(NAME_INPUT_SELECTOR)
    if (!input) return

    input.classList.add(HIGHLIGHT_CLASS)
    window.setTimeout(() => {
      input.classList.remove(HIGHLIGHT_CLASS)
    }, HIGHLIGHT_DURATION_MS)
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
