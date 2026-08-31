import { type WritableComputedRef, computed } from 'vue'

import { useColorMode, useEventListener } from '@vueuse/core'

const DARK_CLASS = 'dark'

export interface UseThemeReturn {
  /** 実際に適用されている配色がダークかどうか（`auto` は解決済みの値で判定する） */
  isDark: WritableComputedRef<boolean>
  toggleTheme: () => void
}

/**
 * ライト / ダークの2状態トグル。
 *
 * 保存先・付与先は `useColorMode` の既定値（`vueuse-color-scheme` / `html` / `class`）に
 * 従うため、`index.html` のFOUC対策スクリプトと同じ判定になる。
 * 初期値は `auto` なので、一度もトグルしていない間はOSの設定に追従する。
 */
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

/**
 * 印刷時だけ `dark` クラスを外す。
 *
 * 印刷用にトークンを再定義すると二重管理になるため、印刷の前後で一時的に
 * ライト配色へ戻す方式を採る。アプリ全体で一度だけ呼ぶこと（`App.vue`）。
 */
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
