/**
 * `npm run capture` で録画した WebM を、README 用のアニメーション WebP に変換する。
 * WSL に ffmpeg（libwebp 対応）が入っていることが前提。
 *
 * WebP を使う理由: GIF は256色制限とフレーム単位の記録で容量が大きくなる。
 * 動画（MP4）は README で自動再生されず、`<picture>` によるテーマ切り替えもできない。
 *
 * 冒頭の空白ページを削るため、録画時に記録した切り出し位置（JSON）から変換を始める。
 * 変化のないフレームはエンコーダが自動でまとめるため、静止時間が長くても容量は増えにくい。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUTPUT_DIR = fileURLToPath(new URL('./output/', import.meta.url))

const SCALE_FILTER = 'fps=12,scale=800:-1:flags=lanczos'

// 画質（0〜100）と圧縮の強さ（0〜6）。模擬映像での比較で決めた値
const WEBP_OPTIONS = ['-lossless', '0', '-q:v', '75', '-compression_level', '6']

// README の表示速度を考慮した目安
const MAX_SIZE_MB = 5

// share-flow は PDF 生成の待ち時間を含むため2倍速にする
const FLOWS = [
  { name: 'survey-flow', speed: 1 },
  { name: 'share-flow', speed: 2 },
]
// playwright.capture.config.ts の録画プロジェクト名と揃える
const THEMES = ['light', 'dark']

let hasOversize = false

for (const { name, speed } of FLOWS) {
  for (const theme of THEMES) {
    const base = `${OUTPUT_DIR}${name}-${theme}`
    const videoFile = `${base}.webm`
    const metaFile = `${base}.json`
    const webpFile = `${base}.webp`

    if (!existsSync(videoFile) || !existsSync(metaFile)) {
      console.error(`${name}-${theme}: 録画がありません。先に npm run capture を実行してください`)
      process.exit(1)
    }

    const { trimStartSec } = JSON.parse(readFileSync(metaFile, 'utf8'))
    const filter = speed === 1 ? SCALE_FILTER : `setpts=PTS/${speed},${SCALE_FILTER}`

    const result = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'error',
        '-ss',
        String(trimStartSec),
        '-i',
        videoFile,
        '-vf',
        filter,
        '-c:v',
        'libwebp_anim',
        ...WEBP_OPTIONS,
        '-loop',
        '0',
        webpFile,
      ],
      { stdio: 'inherit' },
    )

    if (result.error) {
      console.error('ffmpeg を起動できませんでした。インストールされているか確認してください')
      process.exit(1)
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1)
    }

    const sizeMb = statSync(webpFile).size / 1024 / 1024
    const isOversize = sizeMb > MAX_SIZE_MB
    hasOversize ||= isOversize
    console.log(
      `${name}-${theme}.webp: ${sizeMb.toFixed(2)} MB${isOversize ? `（${MAX_SIZE_MB}MB 超過）` : ''}`,
    )
  }
}

if (hasOversize) process.exit(1)
