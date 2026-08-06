import { onUnmounted, ref } from 'vue'

export function useSuccessFeedback(done: () => void, deley = 2000) {
  const success = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  const trigger = () => {
    success.value = true
    timer = setTimeout(() => {
      success.value = false
      done()
    }, deley)
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return { success, trigger }
}
