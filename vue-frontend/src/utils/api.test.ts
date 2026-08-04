import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SurveyState } from '@/types'

import {
  checkSheetExists,
  fetchPdfStatus,
  fetchSheet,
  isBackendEnabled,
  regeneratePdf,
  saveSheet,
} from './api'

const mockSurveyState: SurveyState = {
  userName: 'テストユーザー',
  selections: [
    {
      categoryId: 1,
      isChecked: true,
      questions: [
        {
          questionId: 1,
          answers: [{ answerId: 1, isChecked: true, value: 3 }],
        },
      ],
    },
  ],
}

describe('isBackendEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('VITE_API_BASE_URL が設定されている場合は true を返す', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    expect(isBackendEnabled()).toBe(true)
  })

  it('VITE_API_BASE_URL が未設定の場合は false を返す', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(isBackendEnabled()).toBe(false)
  })
})

describe('saveSheet', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('バックエンド無効時は null を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const id = await saveSheet(mockSurveyState)
    expect(id).toBeNull()
  })

  it('保存成功時に ID を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'abc123' }), { status: 200 }),
    )
    const id = await saveSheet(mockSurveyState)
    expect(id).toBe('abc123')
  })

  it('レスポンスが ok でない場合はエラーを throw する', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }))
    await expect(saveSheet(mockSurveyState)).rejects.toThrow('保存に失敗しました')
  })

  it('POST リクエストが送信される', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'abc123' }), { status: 200 }))
    await saveSheet(mockSurveyState)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/sheets'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('fetchSheet', () => {
  afterEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  it('バックエンド無効時は null を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const result = await fetchSheet('sheet-1')
    expect(result).toBeNull()
  })

  it('取得成功時に status: success とデータを返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    const mockDto = {
      userName: 'テストユーザー',
      categories: [
        {
          categoryId: 1,
          questions: [{ questionId: 1, answers: [{ answerId: 1, value: 3 }] }],
        },
      ],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockDto), { status: 200 }),
    )
    const result = await fetchSheet('sheet-1')
    expect(result).not.toBeNull()
    expect(result!.status).toBe('success')
    if (result!.status === 'success') expect(result!.data.userName).toBe('テストユーザー')
  })

  it('410 の場合は status: expired と expiryDays を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ expiryDays: 5 }), { status: 410 }),
    )
    const result = await fetchSheet('sheet-1')
    expect(result).toEqual({ status: 'expired', expiryDays: 5 })
  })

  it('404 の場合は status: notfound を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))
    const result = await fetchSheet('sheet-1')
    expect(result).toEqual({ status: 'notfound' })
  })

  it('ネットワークエラー時は null を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'))
    const result = await fetchSheet('sheet-1')
    expect(result).toBeNull()
  })
})

describe('checkSheetExists', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('バックエンド無効時は false を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const result = await checkSheetExists('sheet-1')
    expect(result).toBe(false)
  })

  it('レスポンスが ok の場合は true を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))
    const result = await checkSheetExists('sheet-1')
    expect(result).toBe(true)
  })

  it('レスポンスが ok でない場合は false を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))
    const result = await checkSheetExists('sheet-1')
    expect(result).toBe(false)
  })

  it('ネットワークエラー時は false を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'))
    const result = await checkSheetExists('sheet-1')
    expect(result).toBe(false)
  })
})

describe('fetchPdfStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('バックエンド無効時は null を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const result = await fetchPdfStatus('abc123')
    expect(result).toBeNull()
  })

  it('ready の場合は status と downloadUrl を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ready', downloadUrl: 'https://example.com/x.pdf' }), {
        status: 200,
      }),
    )
    const result = await fetchPdfStatus('abc123')
    expect(result).toEqual({ status: 'ready', downloadUrl: 'https://example.com/x.pdf' })
  })

  it('generating の場合は status のみ返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'generating' }), {
        status: 200,
      }),
    )
    const result = await fetchPdfStatus('abc123')
    expect(result).toEqual({ status: 'generating' })
  })

  it('レスポンスが ok でない場合は null を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))
    const result = await fetchPdfStatus('abc123')
    expect(result).toBeNull()
  })

  it('ネットワークエラー時は null を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'))
    const result = await fetchPdfStatus('abc123')
    expect(result).toBeNull()
  })
})

describe('regeneratePdf', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('バックエンド無効時は false を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const result = await regeneratePdf('sheet-1')
    expect(result).toBe(false)
  })

  it('レスポンスが ok の場合は true を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 202 }))
    const result = await regeneratePdf('sheet-1')
    expect(result).toBe(true)
  })

  it('レスポンスが ok でない場合は false を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 429 }))
    const result = await regeneratePdf('sheet-1')
    expect(result).toBe(false)
  })

  it('POST リクエストが送信される', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 202 }))
    await regeneratePdf('sheet-1')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/pdf/sheet-1/regenerate'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('ネットワークエラー時は false を返す', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'))
    const result = await regeneratePdf('sheet-1')
    expect(result).toBe(false)
  })
})
