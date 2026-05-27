import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import tseslint from 'typescript-eslint'           // ✅ 統合パッケージに変更
import vueParser from 'vue-eslint-parser'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,ts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,                   // ✅ 統合パッケージ経由で参照
        sourceType: 'module',
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,                 // ✅ flat config 対応形式
  ...pluginVue.configs['flat/essential'],
  skipFormatting,
])