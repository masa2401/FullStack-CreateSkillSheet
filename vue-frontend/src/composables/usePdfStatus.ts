import { type ComputedRef, type Ref, computed, onUnmounted, ref, watch } from 'vue'

import { fetchPdfStatus, regeneratePdf } from '@/utils/api'

export type PdfGenerationState = 'waiting' | 'generating' | 'slow' | 'ready' | 'error'

/**
 * 待ち時間を環境変数で上書きする。未設定・不正値なら既定値を使う。
 *
 * e2e は実時間で待つため、既定値のままだと1テストに数十秒かかる。
 * `playwright.config.ts` の `webServer.env` から短い値を渡して短縮する。
 */
const durationFromEnv = (raw: unknown, fallbackMs: number): number => {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs
}

/** Lambdaのコールドスタート（実測16秒前後）を踏まえ、初回ポーリングまで待つ時間 */
const INITIAL_DELAY_MS = durationFromEnv(import.meta.env.VITE_PDF_INITIAL_DELAY_MS, 10_000)
/** `generating` の間のポーリング間隔 */
const FAST_INTERVAL_MS = durationFromEnv(import.meta.env.VITE_PDF_FAST_INTERVAL_MS, 3_000)
/** `slow` に移ってからのポーリング間隔 */
const SLOW_INTERVAL_MS = 5_000
/** ここを超えたら `slow` へ。進捗バーが100%になる時刻でもある */
const SLOW_THRESHOLD_MS = 40_000
/** 通算の打ち切り時間 */
const TIMEOUT_MS = 120_000
/** 進捗バーの更新間隔 */
const PROGRESS_TICK_MS = 200

export interface UsePdfStatusReturn {
  state: Ref<PdfGenerationState>
  downloadUrl: Ref<string>
  /** 0〜100。`SLOW_THRESHOLD_MS` を100%として経過時間から算出する */
  progress: ComputedRef<number>
  retry: () => Promise<void>
}

/**
 * シートIDに紐づくPDF生成状態をポーリングするcomposable。
 * sheetIdがセットされる（nullでなくなる）と自動的にポーリングを開始する。
 * AWS Lambda（非同期Invoke）からの明示的な完了通知が無い構成のため、
 * S3オブジェクトの有無を一定間隔で確認する方式を取る。
 *
 * 進捗の実値は取得できないため、バーは経過時間ベースの目安として扱う。
 * 想定時間を超えた場合は `slow` に切り替えて文言で伝える。
 *
 * メニューの開閉でポーリングが巻き戻らないよう、開閉に依らず生存する側
 * （`ShareButton`）で呼ぶこと。
 */
export const usePdfStatus = (sheetId: Ref<string | null>): UsePdfStatusReturn => {
  const state = ref<PdfGenerationState>('waiting')
  const downloadUrl = ref<string>('')
  const elapsedMs = ref<number>(0)

  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let slowTimer: ReturnType<typeof setTimeout> | undefined
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined
  let tickTimer: ReturnType<typeof setInterval> | undefined
  /** 打ち切り後に遅れて返ってきたレスポンスを弾くための世代番号 */
  let runToken = 0

  const progress = computed<number>(() =>
    Math.min(100, Math.round((elapsedMs.value / SLOW_THRESHOLD_MS) * 100)),
  )

  const stopPolling = (): void => {
    runToken++
    if (pollTimer) clearTimeout(pollTimer)
    if (slowTimer) clearTimeout(slowTimer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
    if (tickTimer) clearInterval(tickTimer)
    pollTimer = undefined
    slowTimer = undefined
    timeoutTimer = undefined
    tickTimer = undefined
  }

  const poll = async (id: string, token: number): Promise<void> => {
    try {
      const result = await fetchPdfStatus(id)

      if (token !== runToken || id !== sheetId.value) return

      if (!result) {
        stopPolling()
        state.value = 'error'
        return
      }

      if (result.status === 'ready') {
        stopPolling()
        state.value = 'ready'
        downloadUrl.value = result.downloadUrl
        return
      }

      const interval = state.value === 'slow' ? SLOW_INTERVAL_MS : FAST_INTERVAL_MS
      pollTimer = setTimeout(() => poll(id, token), interval)
    } catch (error) {
      if (token !== runToken || id !== sheetId.value) return

      console.error('PDF状態取得エラー:', error)
      stopPolling()
      state.value = 'error'
    }
  }

  const startPolling = (id: string): void => {
    stopPolling()
    const token = runToken
    state.value = 'generating'

    const startedAt = Date.now()
    elapsedMs.value = 0
    tickTimer = setInterval(() => {
      elapsedMs.value = Date.now() - startedAt
      if (elapsedMs.value >= SLOW_THRESHOLD_MS && tickTimer) {
        clearInterval(tickTimer)
        tickTimer = undefined
      }
    }, PROGRESS_TICK_MS)

    slowTimer = setTimeout(() => {
      if (state.value === 'generating') state.value = 'slow'
    }, SLOW_THRESHOLD_MS)

    timeoutTimer = setTimeout(() => {
      stopPolling()
      state.value = 'error'
    }, TIMEOUT_MS)

    pollTimer = setTimeout(() => poll(id, token), INITIAL_DELAY_MS)
  }

  /** 「再試行」操作。regenerate APIを叩いてからポーリングを最初からやり直す。 */
  const retry = async (): Promise<void> => {
    const currentId = sheetId.value
    if (!currentId) return
    stopPolling()
    state.value = 'generating'

    try {
      const ok = await regeneratePdf(currentId)

      if (currentId !== sheetId.value) return

      if (!ok) {
        state.value = 'error'
        return
      }
      startPolling(currentId)
    } catch (error) {
      if (currentId !== sheetId.value) return
      console.error('PDF再生成エラー:', error)
      state.value = 'error'
    }
  }

  watch(
    sheetId,
    (id) => {
      if (id) {
        startPolling(id)
      } else {
        stopPolling()
        state.value = 'waiting'
        elapsedMs.value = 0
      }
    },
    { immediate: true },
  )
  onUnmounted(stopPolling)

  return { state, downloadUrl, progress, retry }
}
