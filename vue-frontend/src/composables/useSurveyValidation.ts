import type { ComputedRef } from 'vue'

import { useValidation } from '@/composables/useValidation'
import type { MergedCategory, ValidationError } from '@/types'

export const useSurveyValidation = (mergedCategories: ComputedRef<MergedCategory[]>) => {
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
  return useValidation(buildErrors)
}
