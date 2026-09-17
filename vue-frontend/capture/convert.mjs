/**
 * `npm run capture` で取り込んだ画像（PNG）を、README 用のアニメーション WebP に変換する。
 * WSL に ffmpeg（libwebp 対応）が入っていることが前提。
 *
 * WebP を使う理由: GIF は256色制限とフレーム単位の記録で容量が大きくなる。
 * 動画（MP4）は README で自動再生されず、`<picture>` によるテーマ切り替えもできない。
 *
 * 可逆圧縮を使う理由: 非可逆では文字や枠線の周りにブロックノイズが出て、ダークテーマで特に目立つ。
 * UI の画面は平坦な色が多く、変化のない部分はエンコーダがまとめるため、可逆でも目安の容量に収まる。
 *
 * 取り込みは画面が変化したときだけ行われるため、各画像を「次の画像の時刻まで」表示する並びを作ってから変換する。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUTPUT_DIR = fileURLToPath(new URL('./output/', import.meta.url))

// README の表示幅に合わせる。取り込みは2倍の表示倍率なので、ここで縮小する
const OUTPUT_WIDTH = 720
// 取り込み間隔の上限。これより細かい変化はまとめる
const MAX_FPS = 15
const SCALE_FILTER = `fps=${MAX_FPS},scale=${OUTPUT_WIDTH}:-1:flags=lanczos`

// 圧縮の強さ（0〜6）は、6 だと変換時間が倍近くかかる割に容量の差が小さいため 4 にする
const WEBP_OPTIONS = ['-lossless', '1', '-q:v', '75', '-compression_level', '4']

// README の表示速度を考慮した目安
const MAX_SIZE_MB = 5

/** 最後の画像を表示し続ける時間の下限（秒）。停止直前に届いた画像が一瞬で消えないようにする */
const MIN_LAST_DURATION_SEC = 0.1

// share-flow は PDF 生成の待ち時間を含むため2倍速にする
const FLOWS = [
  { name: 'survey-flow', speed: 1 },
  { name: 'share-flow', speed: 2 },
]
// playwright.capture.config.ts の取り込みプロジェクト名と揃える
const THEMES = ['light', 'dark']

/**
 * 各画像を次の画像が届くまで表示する並びを、ffmpeg の concat 形式で書き出す。
 * @returns 書き出したファイルのパス
 */
const writeFrameList = (frameDir, { frames, stoppedAt }) => {
  const lines = ['ffconcat version 1.0']
  frames.forEach((frame, index) => {
    const nextTimestamp =
      frames[index + 1]?.timestamp ?? Math.max(stoppedAt, frame.timestamp + MIN_LAST_DURATION_SEC)
    lines.push(`file '${frame.file}'`, `duration ${(nextTimestamp - frame.timestamp).toFixed(3)}`)
  })
  // concat 形式は最後の duration を無視するため、最後の画像をもう一度並べる
  lines.push(`file '${frames.at(-1).file}'`)

  const listFile = `${frameDir}list.ffconcat`
  writeFileSync(listFile, `${lines.join('\n')}\n`)
  return listFile
}

let hasOversize = false

for (const { name, speed } of FLOWS) {
  for (const theme of THEMES) {
    const frameDir = `${OUTPUT_DIR}${name}-${theme}/`
    const metaFile = `${frameDir}frames.json`
    const webpFile = `${OUTPUT_DIR}${name}-${theme}.webp`

    if (!existsSync(metaFile)) {
      console.error(
        `${name}-${theme}: 取り込み結果がありません。先に npm run capture を実行してください`,
      )
      process.exit(1)
    }
    const meta = JSON.parse(readFileSync(metaFile, 'utf8'))
    if (meta.frames.length === 0) {
      console.error(`${name}-${theme}: 画像が1枚も取り込まれていません`)
      process.exit(1)
    }

    const listFile = writeFrameList(frameDir, meta)
    const filter = speed === 1 ? SCALE_FILTER : `setpts=PTS/${speed},${SCALE_FILTER}`

    const result = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'error',
        '-f',
        'concat',
        '-i',
        listFile,
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
      `${name}-${theme}.webp: ${meta.frames.length} 枚 → ${sizeMb.toFixed(2)} MB${isOversize ? `（${MAX_SIZE_MB}MB 超過）` : ''}`,
    )
  }
}

if (hasOversize) process.exit(1)
