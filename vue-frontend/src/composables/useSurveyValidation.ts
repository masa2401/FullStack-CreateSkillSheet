import type { ComputedRef } from 'vue'
import { computed, ref, watchEffect } from 'vue'

import type { MergedCategory, ValidationError } from '@/types'

export const useSurveyValidation = (mergedCategories: ComputedRef<MergedCategory[]>) => {
  const validationErrors = ref<ValidationError[]>([])
  const hasAttemptedSubmit = ref<boolean>(false)

  const buildErrors = (): ValidationError[] => {
    const errors: ValidationError[] = []
    mergedCategories.value.forEach((cat) => {
      if (!cat.isChecked) return
      cat.questions.forEach((q) => {
        q.answers.forEach((a) => {
          if (a.isChecked && !a.value) {
            errors.push({ category: cat.label, text: q.questionText })
          }
        })
      })
    })
    return errors
  }

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
