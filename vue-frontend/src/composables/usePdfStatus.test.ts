import { ref } from 'vue'

import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as apiUtils from '@/utils/api'

import { usePdfStatus } from './usePdfStatus'

describe('usePdfStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sheetId が null の間は waiting のまま', () => {
    const sheetId = ref<string | null>(null)
    const { state } = usePdfStatus(sheetId)
    expect(state.value).toBe('waiting')
  })

  it('sheetId が設定されると generating に遷移する', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockReturnValue(new Promise(() => {}))
    const sheetId = ref<string | null>('sheet-1')
    const { state } = usePdfStatus(sheetId)
    await flushPromises()
    expect(state.value).toBe('generating')
  })

  it('ready が返ると ready になり downloadUrl がセットされる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({
      status: 'ready',
      downloadUrl: 'https://example.com/skill.pdf',
    })
    const sheetId = ref<string | null>('sheet-1')
    const { state, downloadUrl } = usePdfStatus(sheetId)
    await flushPromises()
    expect(state.value).toBe('ready')
    expect(downloadUrl.value).toBe('https://example.com/skill.pdf')
  })

  it('generating が続く場合は一定間隔でポーリングする', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    usePdfStatus(sheetId)
    await flushPromises()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('一定回数ポーリングしても ready にならない場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    const { state } = usePdfStatus(sheetId)
    await flushPromises()

    // MAX_POLL_COUNT(20) に達するまで残り19回分を進める
    for (let i = 0; i < 19; i++) {
      vi.advanceTimersByTime(3000)
      await flushPromises()
    }

    expect(state.value).toBe('error')
  })

  it('fetchPdfStatus が null を返す場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue(null)
    const sheetId = ref<string | null>('sheet-1')
    const { state } = usePdfStatus(sheetId)
    await flushPromises()
    expect(state.value).toBe('error')
  })

  it('fetchPdfStatus が例外を投げた場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockRejectedValue(new Error('network error'))
    const sheetId = ref<string | null>('sheet-1')
    const { state } = usePdfStatus(sheetId)
    await flushPromises()
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
    const { state } = usePdfStatus(sheetId)
    await flushPromises()
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
    const { state } = usePdfStatus(sheetId)
    await flushPromises()

    sheetId.value = 'sheet-2'
    pendingRejects[0]!(new Error('network error'))
    await flushPromises()

    expect(state.value).toBe('generating')
  })

  it('ポーリング予約後にidが変わると次回ポーリングは実行されない', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' })
    const sheetId = ref<string | null>('sheet-1')
    usePdfStatus(sheetId)
    await flushPromises()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    sheetId.value = 'sheet-2' // 次のsetTimeout予約前にID変更
    await flushPromises()
    fetchSpy.mockClear()

    vi.advanceTimersByTime(3000)
    await flushPromises()
    // sheet-1宛ての古いpollは即return、sheet-2用の新規ポーリングだけ動く想定
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  describe('retry', () => {
    it('regenerate 成功時はポーリングを再開する', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockResolvedValue(true)
      const sheetId = ref<string | null>('sheet-1')
      const { state, retry } = usePdfStatus(sheetId)
      await flushPromises()

      await retry()
      expect(state.value).toBe('generating')
      expect(apiUtils.regeneratePdf).toHaveBeenCalledWith('sheet-1')
    })

    it('regenerate 失敗時は error になる', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockResolvedValue(false)
      const sheetId = ref<string | null>('sheet-1')
      const { state, retry } = usePdfStatus(sheetId)
      await flushPromises()

      await retry()
      expect(state.value).toBe('error')
    })

    it('regeneratePdf が例外を投げた場合は error になる', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValueOnce({ status: 'generating' })
      vi.spyOn(apiUtils, 'regeneratePdf').mockRejectedValue(new Error('network error'))
      const sheetId = ref<string | null>('sheet-1')
      const { retry, state } = usePdfStatus(sheetId)
      await flushPromises()

      await retry()
      expect(state.value).toBe('error')
    })

    it('regenerate待機中にidが変わるとstartPollingされない', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockImplementation((id: string) =>
        Promise.resolve(
          id === 'sheet-1'
            ? { status: 'ready', downloadUrl: 'https://example.com/x.pdf' } // ガード漏れがあれば誤ってこちらが反映される
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
      const { retry, state } = usePdfStatus(sheetId)
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
      const { retry, state } = usePdfStatus(sheetId)
      await flushPromises()

      const retryPromise = retry()
      sheetId.value = 'sheet-2'
      rejectRegenerate(new Error('network error'))
      await retryPromise

      expect(state.value).toBe('generating')
    })
  })
})
