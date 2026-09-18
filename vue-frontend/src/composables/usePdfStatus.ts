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

/** 初回ポーリングまで待つ時間。生成完了の実測（7秒前後）を下回らない */
const INITIAL_DELAY_MS = durationFromEnv(import.meta.env.VITE_PDF_INITIAL_DELAY_MS, 6_000)
/** `generating` の間のポーリング間隔 */
const FAST_INTERVAL_MS = durationFromEnv(import.meta.env.VITE_PDF_FAST_INTERVAL_MS, 2_000)
/** `slow` に移ってからのポーリング間隔 */
const SLOW_INTERVAL_MS = 5_000
/** ここを超えたら `slow` へ。進捗バーが100%になる時刻でもある */
const SLOW_THRESHOLD_MS = 20_000
/** 通算の打ち切り時間。Lambda 側のタイムアウト（30秒）＋往復のマージン。 */
const TIMEOUT_MS = 60_000
/** 進捗バーの更新間隔 */
const PROGRESS_TICK_MS = 200

export interface StartOptions {
  /** 初回の状態確認を待機なしで行う。PDFが生成済みの可能性が高い時に使う */
  immediate?: boolean
}

export interface UsePdfStatusReturn {
  state: Ref<PdfGenerationState>
  downloadUrl: Ref<string>
  /** 0〜100。`SLOW_THRESHOLD_MS` を100%として経過時間から算出する */
  progress: ComputedRef<number>
  /** ポーリングを開始する。進行中・失敗の状態では何もしない */
  start: (options?: StartOptions) => void
  retry: () => Promise<void>
}

/**
 * シートIDに紐づくPDF生成状態をポーリングするcomposable。
 * ポーリングは `start()` を呼んだ時に開始する。sheetId が入っているだけでは開始しない。
 * 永続化された sheetId はページ読み込み時に復元されるため、自動で開始すると
 * 打ち切り（`TIMEOUT_MS`）までの時間が読み込み時点から数えられてしまう。
 * `start()` の後に sheetId が変わった場合は、新しい ID でやり直す。
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
  /** `start()` が呼ばれたか。sheetId が null に戻ると解除する */
  let isRequested = false

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

  const startPolling = (id: string, initialDelayMs: number = INITIAL_DELAY_MS): void => {
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

    pollTimer = setTimeout(() => poll(id, token), initialDelayMs)
  }

  /**
   * `ready` のまま共有メニューを開き直した時に、ダウンロードURLを取り直す。
   * 署名付きURLの有効期限は10分のため、時間が経っていると失効している。
   */
  const refreshDownloadUrl = async (id: string): Promise<void> => {
    const token = runToken
    try {
      const result = await fetchPdfStatus(id)

      if (token !== runToken || id !== sheetId.value || state.value !== 'ready') return

      if (result?.status === 'ready') {
        downloadUrl.value = result.downloadUrl
        return
      }
      // PDFが見つからない場合は、再試行から作り直せる状態にする
      state.value = 'error'
    } catch (error) {
      if (token !== runToken || id !== sheetId.value || state.value !== 'ready') return

      console.error('PDF状態取得エラー:', error)
      state.value = 'error'
    }
  }

  const start = ({ immediate = false }: StartOptions = {}): void => {
    const id = sheetId.value
    if (!id) return

    isRequested = true

    if (state.value === 'ready') {
      void refreshDownloadUrl(id)
      return
    }
    if (state.value === 'waiting') startPolling(id, immediate ? 0 : INITIAL_DELAY_MS)
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

  watch(sheetId, (id) => {
    if (id && isRequested) {
      startPolling(id)
      return
    }
    stopPolling()
    isRequested = false
    state.value = 'waiting'
    elapsedMs.value = 0
  })
  onUnmounted(stopPolling)

  return { state, downloadUrl, progress, start, retry }
}
