import { type ComputedRef, computed } from 'vue'

import { useSurveyStore } from '@/stores/useSurveyStore'
import { getScrollBehavior } from '@/utils/motion'

export const GUEST_HINT_MESSAGE = 'お名前を入力すると、印刷・共有機能が利用できます'

/** `src/components/EditableNameHeading.vue` の入力欄。この data-slot に依存する */
const NAME_INPUT_SELECTOR = '[data-slot="name-input"]'

export interface UseGuestGateReturn {
  isGuest: ComputedRef<boolean>
  /** ゲストなら名前入力欄へ誘導するだけにし、そうでなければactionを実行する */
  guard: (action: () => void) => void
  /** 名前入力欄へフォーカスし、ページ最上部へスクロールする */
  goToNameInput: () => void
}

/**
 * 名前未入力時に印刷・共有ボタンを見た目上グレーアウトしつつ、
 * 押されたら名前入力欄へ誘導するための共通ロジック。
 *
 * 「なぜ押せないか」の提示は Reka UI の Tooltip に委譲するため、
 * ここでは表示状態を一切持たない。
 *
 * スタイルやクラスの付け外しといった DOM の書き換えは行わない。
 * focus() のように宣言的に書けない命令的ブラウザ API の呼び出しに限定する。
 */
export const useGuestGate = (): UseGuestGateReturn => {
  const store = useSurveyStore()
  const isGuest = computed<boolean>(() => !store.userName.trim())

  const goToNameInput = (): void => {
    // focus() は既定で対象をビューポートへ即時スクロールし、
    // 直後の scrollTo を打ち消すため preventScroll で抑止する。
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
