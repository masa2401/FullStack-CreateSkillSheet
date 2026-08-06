import { computed, ref, watchEffect } from 'vue'

import type { ValidationError } from '@/types'

export function useValidation(buildErrors: () => ValidationError[]) {
  const validationErrors = ref<ValidationError[]>([])
  const hasAttemptedSubmit = ref<boolean>(false)

  watchEffect(() => {
    if (!hasAttemptedSubmit.value) return
    validationErrors.value = buildErrors()
  })

  const validate = (): boolean => {
    hasAttemptedSubmit.value = true
    validationErrors.value = buildErrors()
    return validationErrors.value.length === 0
  }

  const isSubmitDisabled = computed(
    () => hasAttemptedSubmit.value && validationErrors.value.length > 0,
  )

  return {
    validationErrors,
    hasAttemptedSubmit,
    validate,
    isSubmitDisabled,
  }
}
