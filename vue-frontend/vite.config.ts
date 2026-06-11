import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import vueDevTools from 'vite-plugin-vue-devtools';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue(), vueDevTools()],
  test: {
    environment: 'happy-dom',
    globals: true,
    restoreMocks: true,
    exclude: [...configDefaults.exclude, '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
