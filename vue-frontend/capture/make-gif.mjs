/**
 * `npm run capture` で録画した WebM を README 用の GIF に変換する。
 * WSL に ffmpeg が入っていることが前提。
 *
 * 冒頭の空白ページを削るため、録画時に記録した切り出し位置（JSON）から変換を始める。
 * パレットを生成してから適用する。省くと GIF の256色制限で色が崩れる。
 * ディザは使わない。録画の圧縮ノイズで模様がフレームごとに変わり、容量が大きく増えるため。
 *
 * 出力した GIF はコミットしない（`docs/images/` は .gitignore 対象）。
 * GitHub の PR コメントに添付し、発行された URL を README から参照する。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const VIDEO_DIR = fileURLToPath(new URL('../../docs/videos/', import.meta.url))
const IMAGE_DIR = fileURLToPath(new URL('../../docs/images/', import.meta.url))

const PALETTE_FILTER =
  'fps=12,scale=800:-1:flags=lanczos,split[s0][s1];' +
  '[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=none'

// README の表示速度を考慮した目安。コメント添付の上限（10MB）より小さく抑える
const MAX_SIZE_MB = 5

// share-flow は PDF 生成の待ち時間を含むため2倍速にする
const TARGETS = [
  { name: 'survey-flow', speed: 1 },
  { name: 'share-flow', speed: 2 },
]

mkdirSync(IMAGE_DIR, { recursive: true })

for (const { name, speed } of TARGETS) {
  const videoFile = `${VIDEO_DIR}${name}.webm`
  const metaFile = `${VIDEO_DIR}${name}.json`
  const gifFile = `${IMAGE_DIR}${name}.gif`

  if (!existsSync(videoFile) || !existsSync(metaFile)) {
    console.error(`${name}: 録画がありません。先に npm run capture を実行してください`)
    process.exit(1)
  }

  const { trimStartSec } = JSON.parse(readFileSync(metaFile, 'utf8'))
  const filter = speed === 1 ? PALETTE_FILTER : `setpts=PTS/${speed},${PALETTE_FILTER}`

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
      '-loop',
      '0',
      gifFile,
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

  const sizeMb = statSync(gifFile).size / 1024 / 1024
  const warning = sizeMb > MAX_SIZE_MB ? `（${MAX_SIZE_MB}MB 超過）` : ''
  console.log(`${name}.gif: ${sizeMb.toFixed(2)} MB${warning}`)
}
