import type { Ref } from 'vue'

import { useValidation } from '@/composables/useValidation'
import type { ValidationError } from '@/types'

export function useNameValidation(userName: Ref<string>) {
  const buildErrors = (): ValidationError[] => {
    if (!userName.value.trim()) {
      return [{ category: '入力必須項目', text: 'お名前を入力してください' }]
    }
    return []
  }
  return useValidation(buildErrors)
}
