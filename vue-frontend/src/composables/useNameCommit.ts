import { computed, ref, watch } from 'vue'

import { useTimeoutFn } from '@vueuse/core'

import { FORMULA_PREFIX } from '@/utils/constants'

/** どの記号が使えないかを利用者が判断できるよう、対象を文面に明記する */
const INVALID_PREFIX_MESSAGE = '先頭に = + - @ は使用できません'

export type NameCommitPhase = 'inputting' | 'confirming' | 'editable' | 'locked'

export interface UseNameCommitOptions {
  confirmDelayMs?: number
  editableWindowMs?: number
  onCommit: (name: string) => void
}

export const useNameCommit = (initialName: string, options: UseNameCommitOptions) => {
  const { confirmDelayMs = 2000, editableWindowMs = 10000, onCommit } = options

  const phase = ref<NameCommitPhase>(initialName.trim() ? 'locked' : 'inputting')
  const draft = ref<string>(initialName)
  const hasUsedEdit = ref<boolean>(false)

  const errorMessage = computed<string>(() =>
    FORMULA_PREFIX.test(draft.value.trim()) ? INVALID_PREFIX_MESSAGE : '',
  )

  const lockTimeout = useTimeoutFn(
    () => {
      phase.value = 'locked'
    },
    editableWindowMs,
    { immediate: false },
  )

  const finalizeCommit = (): void => {
    const trimmed = draft.value.trim()
    onCommit(trimmed)

    if (hasUsedEdit.value) {
      phase.value = 'locked'
      return
    }

    phase.value = 'editable'
    lockTimeout.start()
  }

  const confirmTimeout = useTimeoutFn(finalizeCommit, confirmDelayMs, { immediate: false })

  const requestCommit = (): void => {
    if (phase.value !== 'inputting') return
    if (!draft.value.trim()) return
    if (errorMessage.value) return

    phase.value = 'confirming'
    confirmTimeout.start()
  }

  const cancelPendingCommit = (): void => {
    if (phase.value !== 'confirming') return
    confirmTimeout.stop()
    phase.value = 'inputting'
  }

  const startEdit = (): void => {
    if (phase.value !== 'editable' || hasUsedEdit.value) return
    lockTimeout.stop()
    hasUsedEdit.value = true
    phase.value = 'inputting'
  }

  watch(draft, () => {
    if (phase.value === 'confirming') {
      cancelPendingCommit()
    }
  })

  const isNameInputting = computed(() => phase.value === 'inputting')
  const showEditButton = computed(() => phase.value === 'editable')

  return {
    phase,
    draft,
    isNameInputting,
    showEditButton,
    errorMessage,
    editableWindowMs,
    requestCommit,
    cancelPendingCommit,
    startEdit,
  }
}
