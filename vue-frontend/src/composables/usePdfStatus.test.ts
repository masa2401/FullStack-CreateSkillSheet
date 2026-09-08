import { type Ref, ref } from 'vue'

import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as apiUtils from '@/utils/api'

import { type UsePdfStatusReturn, usePdfStatus } from './usePdfStatus'

const INITIAL_DELAY_MS = 10_000
const FAST_INTERVAL_MS = 3_000
const SLOW_THRESHOLD_MS = 40_000
const TIMEOUT_MS = 120_000

const advanceToFirstPoll = async () => {
  vi.advanceTimersByTime(INITIAL_DELAY_MS)
  await flushPromises()
}

const mountedWrappers: VueWrapper[] = []

/**
 * `usePdfStatus` は `onUnmounted` で後片付けを登録するため、
 * コンポーネントの `setup` の中で呼ぶ必要がある。
 * setup の外で呼ぶと Vue が警告を出したうえで登録自体が行われず、
 * アンマウント時にタイマーが止まる経路が検証できない。
 */
const mountPdfStatus = (sheetId: Ref<string | null>) => {
  let api!: UsePdfStatusReturn
  const wrapper = mount({
    setup() {
      api = usePdfStatus(sheetId)
      return () => null
    },
  })
  mountedWrappers.push(wrapper)
  return { wrapper, ...api }
}

describe('usePdfStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sheetId が null の間は waiting のまま', () => {
    const sheetId = ref<string | null>(null)
    const { state } = mountPdfStatus(sheetId)
    expect(state.value).toBe('waiting')
  })

  it('sheetId が設定されると generating に遷移する', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockReturnValue(new Promise(() => {}))
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await flushPromises()
    expect(state.value).toBe('generating')
  })

  it('初回ポーリングは INITIAL_DELAY_MS 後まで実行されない', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    mountPdfStatus(sheetId)
    await flushPromises()
    expect(fetchSpy).not.toHaveBeenCalled()

    await advanceToFirstPoll()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('ready が返ると ready になり downloadUrl がセットされる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({
      status: 'ready',
      downloadUrl: 'https://example.com/skill.pdf',
    })
    const sheetId = ref<string | null>('sheet-1')
    const { state, downloadUrl } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(state.value).toBe('ready')
    expect(downloadUrl.value).toBe('https://example.com/skill.pdf')
  })

  it('generating が続く場合は FAST_INTERVAL_MS 間隔でポーリングする', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(FAST_INTERVAL_MS)
    await flushPromises()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  // ─── 進捗と slow 遷移 ────────────────────────────

  it('progress は経過時間に応じて 0 から 100 まで進む', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    const { progress } = mountPdfStatus(sheetId)
    await flushPromises()
    expect(progress.value).toBe(0)

    vi.advanceTimersByTime(SLOW_THRESHOLD_MS / 2)
    await flushPromises()
    expect(progress.value).toBeGreaterThanOrEqual(45)
    expect(progress.value).toBeLessThanOrEqual(55)

    vi.advanceTimersByTime(SLOW_THRESHOLD_MS)
    await flushPromises()
    expect(progress.value).toBe(100)
  })

  it('SLOW_THRESHOLD_MS を超えると slow に遷移する', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(state.value).toBe('generating')

    vi.advanceTimersByTime(SLOW_THRESHOLD_MS)
    await flushPromises()
    expect(state.value).toBe('slow')
  })

  it('TIMEOUT_MS を超えても ready にならない場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await flushPromises()

    vi.advanceTimersByTime(TIMEOUT_MS)
    await flushPromises()
    expect(state.value).toBe('error')
  })

  // ─── 異常系 ─────────────────────────────────────

  it('fetchPdfStatus が null を返す場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue(null)
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(state.value).toBe('error')
  })

  it('fetchPdfStatus が例外を投げた場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockRejectedValue(new Error('network error'))
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(state.value).toBe('error')
  })

  it('id変更後にfetchPdfStatusの結果が返っても無視される', async () => {
    const pendingResolvers: Array<(value: { status: 'ready'; downloadUrl: string }) => void> = []
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockImplementation(
      () =>
        new Promise((resolve) => {
          pendingResolvers.push(resolve)
        }),
    )
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(state.value).toBe('generating')

    sheetId.value = 'sheet-2'
    pendingResolvers[0]!({ status: 'ready', downloadUrl: 'https://example.com/old.pdf' })
    await flushPromises()

    expect(state.value).toBe('generating')
  })

  it('id変更中にfetchPdfStatusが例外を投げても無視される', async () => {
    const pendingRejects: Array<(reason: unknown) => void> = []
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockImplementation(
      () =>
        new Promise((_, reject) => {
          pendingRejects.push(reject)
        }),
    )
    const sheetId = ref<string | null>('sheet-1')
    const { state } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()

    sheetId.value = 'sheet-2'
    pendingRejects[0]!(new Error('network error'))
    await flushPromises()

    expect(state.value).toBe('generating')
  })

  it('ポーリング予約後にidが変わると古い予約は実行されない', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    sheetId.value = 'sheet-2'
    await flushPromises()
    fetchSpy.mockClear()

    vi.advanceTimersByTime(FAST_INTERVAL_MS)
    await flushPromises()
    expect(fetchSpy).not.toHaveBeenCalled()

    await advanceToFirstPoll()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  // ─── アンマウント時の後片付け ────────────────────

  it('アンマウントするとポーリングが止まる', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    const { wrapper } = mountPdfStatus(sheetId)
    await advanceToFirstPoll()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    fetchSpy.mockClear()

    vi.advanceTimersByTime(FAST_INTERVAL_MS * 3)
    await flushPromises()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('アンマウントすると進捗の更新も止まる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    const { wrapper, progress } = mountPdfStatus(sheetId)
    vi.advanceTimersByTime(SLOW_THRESHOLD_MS / 4)
    await flushPromises()
    const progressBeforeUnmount = progress.value
    expect(progressBeforeUnmount).toBeGreaterThan(0)

    wrapper.unmount()

    vi.advanceTimersByTime(SLOW_THRESHOLD_MS / 2)
    await flushPromises()
    expect(progress.value).toBe(progressBeforeUnmount)
  })

  // ─── retry ──────────────────────────────────────

  describe('retry', () => {
    it('sheetId が null の場合は何もしない', async () => {
      const regenerateSpy = vi.spyOn(apiUtils, 'regeneratePdf')
      const sheetId = ref<string | null>(null)
      const { retry, state } = mountPdfStatus(sheetId)

      await retry()

      expect(regenerateSpy).not.toHaveBeenCalled()
      expect(state.value).toBe('waiting')
    })

    it('regenerate 成功時は待ち時間も含めてやり直す', async () => {
      const fetchSpy = vi
        .spyOn(apiUtils, 'fetchPdfStatus')
        .mockResolvedValue({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockResolvedValue(true)
      const sheetId = ref<string | null>('sheet-1')
      const { state, progress, retry } = mountPdfStatus(sheetId)
      await advanceToFirstPoll()
      fetchSpy.mockClear()

      await retry()
      expect(state.value).toBe('generating')
      expect(progress.value).toBe(0)
      expect(apiUtils.regeneratePdf).toHaveBeenCalledWith('sheet-1')

      vi.advanceTimersByTime(FAST_INTERVAL_MS)
      await flushPromises()
      expect(fetchSpy).not.toHaveBeenCalled()

      await advanceToFirstPoll()
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('regenerate 失敗時は error になる', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockResolvedValue(false)
      const sheetId = ref<string | null>('sheet-1')
      const { state, retry } = mountPdfStatus(sheetId)
      await advanceToFirstPoll()

      await retry()
      expect(state.value).toBe('error')
    })

    it('regeneratePdf が例外を投げた場合は error になる', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockRejectedValue(new Error('network error'))
      const sheetId = ref<string | null>('sheet-1')
      const { retry, state } = mountPdfStatus(sheetId)
      await advanceToFirstPoll()

      await retry()
      expect(state.value).toBe('error')
    })

    it('regenerate待機中にidが変わるとポーリングを再開しない', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockImplementation((id: string) =>
        Promise.resolve(
          id === 'sheet-1'
            ? { status: 'ready', downloadUrl: 'https://example.com/x.pdf' }
            : { status: 'generating' },
        ),
      )
      let resolveRegenerate!: (value: boolean) => void
      vi.spyOn(apiUtils, 'regeneratePdf').mockReturnValue(
        new Promise((resolve) => {
          resolveRegenerate = resolve
        }),
      )
      const sheetId = ref<string | null>('sheet-1')
      const { retry, state } = mountPdfStatus(sheetId)
      await flushPromises()

      const retryPromise = retry()
      sheetId.value = 'sheet-2'
      resolveRegenerate(true)
      await retryPromise
      await flushPromises()

      expect(state.value).toBe('generating')
    })

    it('regenerate待機中にidが変わり例外が発生しても無視される', async () => {
      let rejectRegenerate!: (reason: Error) => void
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockReturnValue(
        new Promise((_, reject) => {
          rejectRegenerate = reject
        }),
      )
      const sheetId = ref<string | null>('sheet-1')
      const { retry, state } = mountPdfStatus(sheetId)
      await flushPromises()

      const retryPromise = retry()
      sheetId.value = 'sheet-2'
      rejectRegenerate(new Error('network error'))
      await retryPromise

      expect(state.value).toBe('generating')
    })
  })
})
