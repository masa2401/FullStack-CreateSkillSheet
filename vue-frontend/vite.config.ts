import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import vueDevTools from 'vite-plugin-vue-devtools'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue(), vueDevTools(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
    exclude: [...configDefaults.exclude, '**/e2e/**'],
    coverage: {
      exclude: [
        ...(configDefaults.coverage?.exclude ?? []),
        'src/views/NotFound.vue',
        // shadcn-vue が生成したコンポーネント。自前のロジックを持たないため計測対象外にする
        'src/components/ui/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
