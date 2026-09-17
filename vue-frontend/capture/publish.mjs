/**
 * `npm run capture:convert` で作った WebP を media ブランチに公開する。
 * README は raw.githubusercontent.com 経由で media ブランチのファイルを参照する。
 *
 * media ブランチは毎回「WebP と説明用 README、Vercel 設定だけを含む1コミット」で作り直して強制 push する。
 * 古いファイルが履歴に残らないため、更新してもリポジトリの容量が増え続けない。
 * 作業ブランチには触れないよう、一時ディレクトリの worktree で作業する。
 *
 * Vercel は全ブランチへの push でプレビューデプロイを作り、アプリのない media ブランチでは失敗する。
 * Vercel はデプロイ設定を push されたコミットの Root Directory（vue-frontend）から読むため、
 * media ブランチ側に自動デプロイを無効にする vercel.json を置く。
 */
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const OUTPUT_DIR = fileURLToPath(new URL('./output/', import.meta.url))
const REMOTE = 'origin'
const BRANCH = 'media'

// convert.mjs の出力と揃える
const FILES = ['survey-flow', 'share-flow'].flatMap((name) =>
  ['light', 'dark'].map((theme) => `${name}-${theme}.webp`),
)

// Vercel プロジェクトの Root Directory に合わせる
const VERCEL_CONFIG_PATH = 'vue-frontend/vercel.json'
const VERCEL_CONFIG = { git: { deploymentEnabled: false } }

const BRANCH_README = `# media ブランチ

README に掲載する操作動画（アニメーション WebP）の置き場所です。
\`vue-frontend\` の \`npm run capture:publish\` が毎回作り直して強制 push するため、直接編集しないでください。
\`${VERCEL_CONFIG_PATH}\` は、このブランチへの push で Vercel のデプロイが走らないようにするための設定です。
手順は \`vue-frontend/capture/README.md\` を参照してください。
`

/**
 * git を実行し、標準出力を返す。失敗したら例外にする。
 * inherit を指定すると出力をそのまま端末に流す（push の進捗や認証の入力用）。
 */
const git = (args, cwd, { inherit = false } = {}) => {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
  })
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} に失敗しました\n${result.stderr ?? ''}`)
  }
  return (result.stdout ?? '').trim()
}

const missing = FILES.filter((file) => !existsSync(join(OUTPUT_DIR, file)))
if (missing.length > 0) {
  console.error(`変換結果がありません: ${missing.join(', ')}`)
  console.error('先に npm run capture と npm run capture:convert を実行してください')
  process.exit(1)
}

const repoRoot = git(['rev-parse', '--show-toplevel'])
const remoteUrl = git(['remote', 'get-url', REMOTE], repoRoot)
const repoSlug = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1]
if (repoSlug === undefined) {
  console.error(`${REMOTE} が GitHub のリポジトリではありません: ${remoteUrl}`)
  process.exit(1)
}

console.log(`公開先: ${repoSlug} の ${BRANCH} ブランチ（既存の内容と履歴は置き換えます）`)
for (const file of FILES) {
  const sizeMb = statSync(join(OUTPUT_DIR, file)).size / 1024 / 1024
  console.log(`  ${file}: ${sizeMb.toFixed(2)} MB`)
}

const prompt = createInterface({ input: process.stdin, output: process.stdout })
const answer = await prompt.question('公開しますか？ (y/N) ')
prompt.close()
if (answer.trim().toLowerCase() !== 'y') {
  console.log('中止しました')
  process.exit(0)
}

const workDir = mkdtempSync(join(tmpdir(), 'media-publish-'))
const tempBranch = `media-publish-${Date.now()}`
let hasWorktree = false

try {
  git(['worktree', 'add', '--detach', workDir], repoRoot)
  hasWorktree = true

  // 履歴を持たない空のブランチから作る
  git(['switch', '--orphan', tempBranch], workDir)
  for (const file of FILES) {
    copyFileSync(join(OUTPUT_DIR, file), join(workDir, file))
  }
  writeFileSync(join(workDir, 'README.md'), BRANCH_README)
  const vercelConfigFile = join(workDir, VERCEL_CONFIG_PATH)
  mkdirSync(dirname(vercelConfigFile), { recursive: true })
  writeFileSync(vercelConfigFile, `${JSON.stringify(VERCEL_CONFIG, null, 2)}\n`)

  git(['add', '--all'], workDir)
  git(['commit', '--no-verify', '-m', 'README用メディアを更新'], workDir)
  git(['push', '--force', REMOTE, `HEAD:refs/heads/${BRANCH}`], workDir, { inherit: true })
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  if (hasWorktree) git(['worktree', 'remove', '--force', workDir], repoRoot)
  else rmSync(workDir, { recursive: true, force: true })
  // コミット前に失敗した場合はブランチが無いので、結果は確認しない
  spawnSync('git', ['branch', '-D', tempBranch], { cwd: repoRoot, stdio: 'ignore' })
}

if (process.exitCode !== 1) {
  console.log('\n公開しました。README からは次の URL で参照します（反映まで最大5分）')
  for (const file of FILES) {
    console.log(`  https://raw.githubusercontent.com/${repoSlug}/${BRANCH}/${file}`)
  }
}
