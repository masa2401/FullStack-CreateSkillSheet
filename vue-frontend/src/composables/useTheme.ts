import { type WritableComputedRef, computed } from 'vue'

import { useColorMode, useEventListener } from '@vueuse/core'

const DARK_CLASS = 'dark'

export interface UseThemeReturn {
  isDark: WritableComputedRef<boolean>
  toggleTheme: () => void
}

export const useTheme = (): UseThemeReturn => {
  const mode = useColorMode()

  const isDark = computed<boolean>({
    get: () => mode.state.value === DARK_CLASS,
    set: (value) => {
      mode.value = value ? 'dark' : 'light'
    },
  })

  const toggleTheme = (): void => {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
}

export const usePrintColorScheme = (): void => {
  let restoreDark = false

  useEventListener(window, 'beforeprint', () => {
    restoreDark = document.documentElement.classList.contains(DARK_CLASS)
    if (restoreDark) {
      document.documentElement.classList.remove(DARK_CLASS)
    }
  })

  useEventListener(window, 'afterprint', () => {
    if (restoreDark) {
      document.documentElement.classList.add(DARK_CLASS)
    }
    restoreDark = false
  })
}
