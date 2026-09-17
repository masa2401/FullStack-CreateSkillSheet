import { defineConfig } from '@playwright/test'

/**
 * README 用の操作動画の元になる画面を取り込む設定。手順は `capture/README.md` を参照。
 * 通常の e2e（`playwright.config.ts`）とは独立して実行する。
 *
 * 撮影先は本番環境。dev サーバでは vite-plugin-vue-devtools の
 * フローティングボタンが画面に映り込むため使わない。
 */
const VIEWPORT = { width: 900, height: 650 }

/** 取り込みを行うテストファイル。暖機（00-warmup）は含めない */
const RECORDING_SPECS = /0[1-9]-.*\.spec\.ts/

export default defineConfig({
  testDir: './capture',
  // e2e の実行結果と混ざらないよう分ける
  outputDir: './test-results/capture',
  // 並列実行すると負荷で操作や取り込みの間隔が乱れ、暖機の順序も保てない
  workers: 1,
  // PDF 生成の待ち時間（最大60秒で打ち切り）を含むため既定の30秒から延ばす
  timeout: 90_000,
  use: {
    baseURL: 'https://full-stack-create-skill-sheet.vercel.app',
    viewport: VIEWPORT,
    // 文字の輪郭をくっきり取り込むため2倍の表示倍率にする。出力サイズへの縮小は変換時に行う
    deviceScaleFactor: 2,
    // 取り込み（helpers.ts の createRecorder）と同じ仕組みを使うため、動画録画は使わない
    video: 'off',
  },
  // プロジェクト名は出力ファイル名の末尾（-light / -dark）に使われる
  projects: [
    {
      // 本番のバックエンドと PDF 生成をコールドスタートから起こす
      name: 'warmup',
      testMatch: /00-warmup\.spec\.ts/,
    },
    {
      name: 'light',
      testMatch: RECORDING_SPECS,
      dependencies: ['warmup'],
      // アプリは OS（ブラウザ）の設定に合わせてテーマを切り替える
      use: { colorScheme: 'light' },
    },
    {
      name: 'dark',
      testMatch: RECORDING_SPECS,
      dependencies: ['warmup'],
      use: { colorScheme: 'dark' },
    },
  ],
})
