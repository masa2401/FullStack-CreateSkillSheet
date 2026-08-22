import { nextTick } from 'vue'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNameCommit } from './useNameCommit'

describe('useNameCommit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初期値が空文字の場合は editing から始まる', () => {
    const { phase } = useNameCommit('', { onCommit: vi.fn() })
    expect(phase.value).toBe('editing')
  })

  it('初期値が既に入っている場合は locked から始まる（確認・訂正フローを経ない）', () => {
    const onCommit = vi.fn()
    const { phase } = useNameCommit('山田太郎', { onCommit })
    expect(phase.value).toBe('locked')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('空文字のままrequestCommitしても何も起きない（ゲスト継続）', () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit } = useNameCommit('', { onCommit })
    draft.value = '   '
    requestCommit()
    expect(phase.value).toBe('editing')
    vi.runAllTimers()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('非空でrequestCommit → confirming → 自動タイムアウトでcommittedになりonCommitが呼ばれる', () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit } = useNameCommit('', {
      onCommit,
      confirmDelayMs: 1000,
    })
    draft.value = '田中太郎'
    requestCommit()
    expect(phase.value).toBe('confirming')
    expect(onCommit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(phase.value).toBe('committed')
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('田中太郎')
  })

  it('confirming中に再フォーカス（cancelPendingCommit）すると editing に戻り確定しない', () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit, cancelPendingCommit } = useNameCommit('', {
      onCommit,
      confirmDelayMs: 1000,
    })
    draft.value = '田中太郎'
    requestCommit()
    expect(phase.value).toBe('confirming')

    cancelPendingCommit()
    expect(phase.value).toBe('editing')

    vi.advanceTimersByTime(5000)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('confirming中に入力値が変化すると自動的にキャンセルされeditingに戻る', async () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit } = useNameCommit('', {
      onCommit,
      confirmDelayMs: 1000,
    })
    draft.value = '田中太郎'
    requestCommit()
    expect(phase.value).toBe('confirming')

    draft.value = '田中次郎'
    await nextTick()

    expect(phase.value).toBe('editing')
    vi.advanceTimersByTime(5000)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('committed状態は一定時間で自動的にlockedへ進む', () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit } = useNameCommit('', {
      onCommit,
      confirmDelayMs: 100,
      correctionWindowMs: 500,
    })
    draft.value = '田中太郎'
    requestCommit()
    vi.advanceTimersByTime(100)
    expect(phase.value).toBe('committed')

    vi.advanceTimersByTime(500)
    expect(phase.value).toBe('locked')
  })

  it('committed中にstartCorrectionを使うとeditingに戻れるが、次の確定では訂正リンクを経ずlockedに進む', () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit, startCorrection } = useNameCommit('', {
      onCommit,
      confirmDelayMs: 100,
      correctionWindowMs: 500,
    })
    draft.value = '田中太郎'
    requestCommit()
    vi.advanceTimersByTime(100)
    expect(phase.value).toBe('committed')

    startCorrection()
    expect(phase.value).toBe('editing')

    draft.value = '田中次郎'
    requestCommit()
    vi.advanceTimersByTime(100)

    expect(phase.value).toBe('locked')
    expect(onCommit).toHaveBeenLastCalledWith('田中次郎')
    expect(onCommit).toHaveBeenCalledTimes(2)
  })

  it('locked状態でrequestCommitを呼んでも何も起きない', () => {
    const onCommit = vi.fn()
    const { phase, requestCommit } = useNameCommit('既に確定済み', { onCommit })
    expect(phase.value).toBe('locked')

    requestCommit()
    expect(phase.value).toBe('locked')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('committed状態でstartCorrectionを二重に使うことはできない', () => {
    const onCommit = vi.fn()
    const { phase, draft, requestCommit, startCorrection } = useNameCommit('', {
      onCommit,
      confirmDelayMs: 100,
    })
    draft.value = '田中太郎'
    requestCommit()
    vi.advanceTimersByTime(100)
    expect(phase.value).toBe('committed')

    startCorrection()
    expect(phase.value).toBe('editing')

    // すでにeditingに戻っているのでstartCorrectionはガードされ何も起きない
    startCorrection()
    expect(phase.value).toBe('editing')
  })
})
