import { type ComputedRef, type Ref, computed, ref } from 'vue'

import { onClickOutside, useEventListener } from '@vueuse/core'

import { useSurveyStore } from '@/stores/useSurveyStore'

export const GUEST_HINT_MESSAGE = 'お名前を入力すると、印刷・共有機能が利用できます'

const NAME_INPUT_SELECTOR = '.page-title-input'
const HIGHLIGHT_CLASS = 'is-highlighted'
const HIGHLIGHT_DURATION_MS = 1500
const HOVER_HIDE_DELAY_MS = 150

export interface UseGuestGateReturn {
  isGuest: ComputedRef<boolean>
  isTooltipVisible: Ref<boolean>
  /** ゲストならツールチップを表示するだけにし、そうでなければactionを実行する */
  guard: (action: () => void) => void
  /** ツールチップ内の誘導リンクから呼ぶ。名前入力欄へスクロールし一時的にハイライトする */
  goToNameInput: () => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  handleFocusIn: () => void
  handleFocusOut: () => void
}

/**
 * 名前未入力時に印刷・共有ボタンをグレーアウトしつつ、
 * ホバー/フォーカス/クリックでツールチップ誘導を行うための共通ロジック。
 *
 * PrintButton.vue / ShareButton.vue それぞれから独立したインスタンスとして呼び出す想定
 * （isGuestやツールチップの表示状態はボタンごとに個別に持つ）。
 *
 * @param containerRef ツールチップの位置基準・外側クリック判定の対象となる、
 *                      ボタンとツールチップを包む要素へのref
 */
export const useGuestGate = (containerRef: Ref<HTMLElement | null>): UseGuestGateReturn => {
  const store = useSurveyStore()
  const isGuest = computed<boolean>(() => !store.userName.trim())
  const isTooltipVisible = ref<boolean>(false)

  let hoverHideTimer: ReturnType<typeof setTimeout> | null = null

  const clearHoverHideTimer = (): void => {
    if (hoverHideTimer === null) return
    clearTimeout(hoverHideTimer)
    hoverHideTimer = null
  }

  const showTooltip = (): void => {
    clearHoverHideTimer()
    isTooltipVisible.value = true
  }

  const hideTooltip = (): void => {
    clearHoverHideTimer()
    isTooltipVisible.value = false
  }

  onClickOutside(containerRef, hideTooltip)

  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isTooltipVisible.value) hideTooltip()
  })

  const guard = (action: () => void): void => {
    if (isGuest.value) {
      showTooltip()
      return
    }
    action()
  }

  const goToNameInput = (): void => {
    hideTooltip()
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const input = document.querySelector<HTMLElement>(NAME_INPUT_SELECTOR)
    if (!input) return

    input.classList.add(HIGHLIGHT_CLASS)
    window.setTimeout(() => {
      input.classList.remove(HIGHLIGHT_CLASS)
    }, HIGHLIGHT_DURATION_MS)
  }

  const handleMouseEnter = (): void => {
    if (!isGuest.value) return
    showTooltip()
  }

  const handleMouseLeave = (): void => {
    if (!isGuest.value) return
    clearHoverHideTimer()
    hoverHideTimer = setTimeout(hideTooltip, HOVER_HIDE_DELAY_MS)
  }

  return {
    isGuest,
    isTooltipVisible,
    guard,
    goToNameInput,
    handleMouseEnter,
    handleFocusIn: handleMouseEnter,
    handleMouseLeave,
    handleFocusOut: handleMouseLeave,
  }
}
