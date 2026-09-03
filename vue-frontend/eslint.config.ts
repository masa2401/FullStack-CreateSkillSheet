import vueParser from 'vue-eslint-parser'

import js from '@eslint/js'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import vitest from '@vitest/eslint-plugin'

import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import playwright from 'eslint-plugin-playwright'
import vueA11y from 'eslint-plugin-vuejs-accessibility'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    rules: {
      'vue/require-default-prop': 'off',
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
    },
  },

  {
    ...vitest.configs.recommended,
    files: ['src/**/*.{test,spec}.ts'],
  },

  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.ts'],
  },

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
    ...tseslint.configs.disableTypeChecked,
    files: ['**/*.{js,mjs,jsx}'],
  },

  {
    files: ['**/*.vue'],
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/assets/index.css',
        attributes: [
          'class',
          'enter-active-class',
          'enter-from-class',
          'leave-active-class',
          'leave-to-class',
        ],
      },
    },
    rules: {
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unknown-classes': [
        'warn',
        { ignore: ['^button-icon$', '^button-text$', '^menu-icon$'] },
      ],
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
  },

  {
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vuejs-accessibility/label-has-for': 'off',
    },
  },

  skipFormatting,
])