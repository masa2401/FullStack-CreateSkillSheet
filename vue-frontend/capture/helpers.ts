import { type CDPSession, type Locator, type Page, test } from '@playwright/test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import type { CategorySelection } from '@/types'

/** 取り込み画像と変換結果の出力先（.gitignore 対象）。`convert.mjs` / `publish.mjs` と揃える */
const OUTPUT_DIR = fileURLToPath(new URL('./output/', import.meta.url))

/**
 * 撮影で使う回答。survey-flow の操作結果（Slack 4 / TypeScript 4）と同じ内容で、
 * share-flow と暖機はこれを投入して結果ページから始める。
 */
export const SURVEY_SELECTIONS: CategorySelection[] = [
  {
    categoryId: 1,
    isChecked: true,
    questions: [{ questionId: 2, answers: [{ answerId: 1, isChecked: true, value: 4 }] }],
  },
  {
    categoryId: 2,
    isChecked: true,
    questions: [{ questionId: 1, answers: [{ answerId: 5, isChecked: true, value: 4 }] }],
  },
  { categoryId: 3, isChecked: false, questions: [] },
]

interface ScreencastFrame {
  /** 取り込み先フォルダ内のファイル名 */
  file: string
  /** 画面が描画された時刻（UNIX 時間の秒） */
  timestamp: number
}

export interface Recorder {
  /** 画面の描画が済んだ時点で呼び、取り込みを始める。空白ページや読み込み中は取り込まない */
  start: () => Promise<void>
  /** 取り込みを止め、画像の書き込み完了を待ってから frames.json を保存する */
  save: () => Promise<void>
}

/**
 * Chromium のスクリーンキャスト機能で、画面が変化するたびに PNG（無劣化）を保存する。
 * Playwright の動画録画は録画中に圧縮されるため、スクロール時に文字の欠けやブロックノイズが出る。
 * 変化がない間は画像が届かないため、各画像の表示時間は frames.json の時刻から決める。
 * 保存先はプロジェクト名（テーマ）付きのフォルダ（例: output/survey-flow-light/）。
 * 動画録画も同じ仕組みを使うため、`playwright.capture.config.ts` で録画は無効にしている。
 */
export const createRecorder = (page: Page, name: string): Recorder => {
  const frameDir = `${OUTPUT_DIR}${name}-${test.info().project.name}/`
  const frames: ScreencastFrame[] = []
  const writes: Promise<void>[] = []
  let session: CDPSession | null = null
  let isStopped = false

  return {
    start: async () => {
      await rm(frameDir, { recursive: true, force: true })
      await mkdir(frameDir, { recursive: true })

      const client = await page.context().newCDPSession(page)
      session = client
      client.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
        if (isStopped) return
        const file = `${String(frames.length).padStart(5, '0')}.png`
        frames.push({ file, timestamp: metadata.timestamp ?? Date.now() / 1000 })
        writes.push(writeFile(`${frameDir}${file}`, Buffer.from(data, 'base64')))
        // 受け取りを返さないと次の画像が届かない。書き込みを待たずに返して取りこぼしを減らす
        void client.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
      })

      // 表示倍率2倍で撮るため、上限は viewport の2倍より大きく取る
      await client.send('Page.startScreencast', {
        format: 'png',
        maxWidth: 2000,
        maxHeight: 2000,
        everyNthFrame: 1,
      })
    },
    save: async () => {
      if (session === null) throw new Error('start() を呼ぶ前に save() が呼ばれました')
      await session.send('Page.stopScreencast')
      isStopped = true
      const stoppedAt = Date.now() / 1000
      await Promise.all(writes)
      await writeFile(`${frameDir}frames.json`, JSON.stringify({ frames, stoppedAt }))
      await session.detach()
    },
  }
}

/**
 * 取り込み画像に映る疑似カーソルを仕込む。goto の前に呼ぶ。
 * スクリーンキャストにはマウスカーソルが映らないため、DOM で描画する。
 */
export const installCursor = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const dot = document.createElement('div')
    dot.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:18px',
      'height:18px',
      'border-radius:50%',
      'background:rgba(0,0,0,.35)',
      'border:2px solid #fff',
      'z-index:2147483647',
      'pointer-events:none',
      'transform:translate(-50%,-50%)',
      'transition:transform .08s',
    ].join(';')

    const attach = (): void => {
      document.body.appendChild(dot)
    }
    if (document.body) attach()
    else document.addEventListener('DOMContentLoaded', attach)

    document.addEventListener(
      'mousemove',
      (e) => {
        dot.style.left = `${e.clientX}px`
        dot.style.top = `${e.clientY}px`
      },
      true,
    )
    document.addEventListener(
      'mousedown',
      () => {
        dot.style.transform = 'translate(-50%,-50%) scale(.7)'
      },
      true,
    )
    document.addEventListener(
      'mouseup',
      () => {
        dot.style.transform = 'translate(-50%,-50%) scale(1)'
      },
      true,
    )
  })
}

/**
 * 要素が画面外にあれば、中央に来るまでスムーズスクロールする。
 * `scrollIntoViewIfNeeded` は瞬間移動するため、撮影結果では画面が飛んで見える。
 * スクロールが止まった（5フレーム連続で位置が変わらない）時点で戻る。
 */
export const smoothScrollTo = async (locator: Locator): Promise<void> => {
  await locator.waitFor()
  await locator.evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        const margin = 80
        const rect = el.getBoundingClientRect()
        if (rect.top >= margin && rect.bottom <= window.innerHeight - margin) {
          resolve()
          return
        }

        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        let lastY = -1
        let stillFrames = 0
        const tick = (): void => {
          const y = window.scrollY
          stillFrames = y === lastY ? stillFrames + 1 : 0
          lastY = y
          if (stillFrames >= 5) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
}

/** カーソルを要素の中央へ滑らせる。クリックはしない */
export const slowHover = async (page: Page, locator: Locator): Promise<void> => {
  await smoothScrollTo(locator)
  // スクロール中に要素が消えたり別の要素に置き換わったりした場合、テスト全体のタイムアウトまで待たずに早めに失敗させる
  const box = await locator.boundingBox({ timeout: 10_000 })
  if (box === null) throw new Error('要素の位置を取得できませんでした')

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 25,
  })
  await page.waitForTimeout(300)
}

/**
 * カーソルを滑らせてからクリックする。
 * `locator.click()` はカーソルが瞬間移動するため、撮影では使わない。
 */
export const slowClick = async (page: Page, locator: Locator): Promise<void> => {
  await slowHover(page, locator)
  await page.mouse.down()
  await page.waitForTimeout(80)
  await page.mouse.up()
  await page.waitForTimeout(300)
}

/** 回答項目にチェックを入れ、表示された習熟度を選ぶ */
export const answerSkill = async (page: Page, label: string, level: number): Promise<void> => {
  await slowClick(page, page.getByRole('checkbox', { name: label, exact: true }))

  // `src/components/AnswerItem.vue` の RadioGroup は「<ラベル> の習熟度」、
  // 各項目は「習熟度 3: 期待どおりにできる」の形でアクセシブル名を持つ
  const radio = page
    .getByRole('radiogroup', { name: `${label} の習熟度`, exact: true })
    .getByRole('radio', { name: new RegExp(`^習熟度 ${level}:`) })
  await slowClick(page, radio)
}

/**
 * 回答済みの状態を localStorage に書き込んでから結果ページを開く。
 * 保存形式は `src/stores/useSurveyStore.ts` の persist 設定に合わせる。
 */
export const seedAndGotoResult = async (
  page: Page,
  selections: CategorySelection[],
): Promise<void> => {
  const persisted = {
    userName: '',
    selections,
    savedSheetId: null,
    savedDataSnapshot: '',
  }
  await page.addInitScript((value) => {
    window.localStorage.setItem('survey', value)
  }, JSON.stringify(persisted))
  await page.goto('/#/result')
}

/** ブラウザのコンソールエラーをターミナルへ出す。失敗時の原因調査用 */
export const forwardConsoleErrors = (page: Page): void => {
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(`[browser] ${message.text()}`)
  })
}

/**
 * 共有メニューの PDF 項目が「ダウンロード」か「失敗」に変わるまで待ち、どちらになったかを返す。
 * アプリ側は開始から60秒で打ち切って「失敗」にするため、それより少し長く待つ。
 * 文言は `src/components/PdfButton.vue` に合わせる。
 */
export const waitForPdfSettled = async (page: Page): Promise<'ready' | 'error'> => {
  const settled = page.getByRole('menuitem', { name: /^(PDFをダウンロード|PDF生成に失敗)/ })
  await settled.waitFor({ timeout: 70_000 })
  const text = (await settled.textContent()) ?? ''
  return text.includes('PDFをダウンロード') ? 'ready' : 'error'
}
