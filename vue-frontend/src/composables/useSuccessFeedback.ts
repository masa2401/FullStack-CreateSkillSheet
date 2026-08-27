import { ref } from 'vue'

import { useTimeoutFn } from '@vueuse/core'

export const useSuccessFeedback = (done: () => void, deley = 2000) => {
  const success = ref(false)

  const { start } = useTimeoutFn(
    () => {
      success.value = false
      done()
    },
    deley,
    { immediate: false },
  )

  const trigger = () => {
    success.value = true
    start()
  }

  return { success, trigger }
}
