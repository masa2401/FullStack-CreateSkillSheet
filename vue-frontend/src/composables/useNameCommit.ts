import { computed, ref, watch } from 'vue'

import { useTimeoutFn } from '@vueuse/core'

export type NameCommitPhase = 'editing' | 'confirming' | 'committed' | 'locked'

export interface UseNameCommitOptions {
  confirmDelayMs?: number
  editableWindowMs?: number
  onCommit: (name: string) => void
}

export const useNameCommit = (initialName: string, options: UseNameCommitOptions) => {
  const { confirmDelayMs = 2000, editableWindowMs = 10000, onCommit } = options

  const phase = ref<NameCommitPhase>(initialName.trim() ? 'locked' : 'editing')
  const draft = ref<string>(initialName)
  const editUsed = ref<boolean>(false)

  const editTimeout = useTimeoutFn(
    () => {
      phase.value = 'locked'
    },
    editableWindowMs,
    { immediate: false },
  )

  const finalizeCommit = (): void => {
    const trimmed = draft.value.trim()
    onCommit(trimmed)

    if (editUsed.value) {
      phase.value = 'locked'
      return
    }

    phase.value = 'committed'
    editTimeout.start()
  }

  const confirmTimeout = useTimeoutFn(finalizeCommit, confirmDelayMs, { immediate: false })

  const requestCommit = (): void => {
    if (phase.value !== 'editing') return
    if (!draft.value.trim()) return

    phase.value = 'confirming'
    confirmTimeout.start()
  }

  const cancelPendingCommit = (): void => {
    if (phase.value !== 'confirming') return
    confirmTimeout.stop()
    phase.value = 'editing'
  }

  const startEdit = (): void => {
    if (phase.value !== 'committed' || editUsed.value) return
    editTimeout.stop()
    editUsed.value = true
    phase.value = 'editing'
  }

  watch(draft, () => {
    if (phase.value === 'confirming') {
      cancelPendingCommit()
    }
  })

  const isEditable = computed(() => phase.value === 'editing')
  const isLocked = computed(() => phase.value === 'locked')
  const showEditButton = computed(() => phase.value === 'committed')

  return {
    phase,
    draft,
    isEditable,
    isLocked,
    showEditButton,
    editableWindowMs,
    requestCommit,
    cancelPendingCommit,
    startEdit,
  }
}
