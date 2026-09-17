import { defineConfig } from '@playwright/test'

/**
 * README 用の操作GIFの元になる動画を録画する設定。
 * 通常の e2e（`playwright.config.ts`）とは独立して実行する。
 *
 * 録画先は本番環境。dev サーバでは vite-plugin-vue-devtools の
 * フローティングボタンが画面に映り込むため使わない。
 */
const VIEWPORT = { width: 900, height: 650 }

export default defineConfig({
  testDir: './capture',
  // 並列実行すると録画が混ざる
  workers: 1,
  // PDF 生成の待ち時間（最大60秒で打ち切り）を含むため既定の30秒から延ばす
  timeout: 90_000,
  use: {
    baseURL: 'https://full-stack-create-skill-sheet.vercel.app',
    // 録画サイズと一致させる。ずれると縮小して録画される
    viewport: VIEWPORT,
    // OS の設定に左右されないよう固定する
    colorScheme: 'light',
    video: { mode: 'on', size: VIEWPORT },
  },
})
