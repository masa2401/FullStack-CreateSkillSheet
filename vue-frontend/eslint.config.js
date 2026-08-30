import vueParser from 'vue-eslint-parser'

import js from '@eslint/js'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'node_modules/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    files: ['**/*.{js,mjs,jsx,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },

  {
    files: ['**/*.{js,mjs,jsx}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // shadcn-vue の生成コンポーネントは Button.vue / Card.vue のように
  // 単語1つのファイル名になるため、このディレクトリのみルールを無効化する。
  // 他のルールは生成物にも適用したいので globalIgnores は使わない。
  {
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  skipFormatting,
])
