import type { SurveyState } from '@/types'
import LZString from 'lz-string'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  copyToClipboard,
  createShareUrl,
  decodeData,
  encodeData,
  getDataFromUrl,
  getIdFromUrl,
} from './shareUtils'

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

describe('encodeData', () => {
  it('エンコード結果が文字列で返る', () => {
    const result = encodeData(mockSurveyState)
    expect(typeof result).toBe('string')
  })

  it('空のuserNameはエンコードできる', () => {
    const data = { ...mockSurveyState, userName: '' }
    const result = encodeData(data)
    expect(result).not.toBeNull()
  })
})

describe('decodeData', () => {
  it('エンコード→デコードで元のデータに戻る', () => {
    const encoded = encodeData(mockSurveyState)!
    const decoded = decodeData(encoded)
    expect(decoded).toEqual(mockSurveyState)
  })

  it('不正な文字列はnullを返す', () => {
    const result = decodeData('invalid-string')
    expect(result).toBeNull()
  })
})

describe('createShareUrl', () => {
  const url = createShareUrl(mockSurveyState)

  it('data パラメータを含む URL が生成される', () => {
    expect(url).toContain('data=')
  })

  it('result ページへのハッシュが含まれる', () => {
    expect(url).toContain('#/result')
  })
})

describe('getDataFromUrl', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('data パラメータがあればデコードして返す', () => {
    const encoded = encodeData(mockSurveyState)!
    window.location.hash = `/result?data=${encoded}`
    expect(getDataFromUrl()).toEqual(mockSurveyState)
  })

  it('ハッシュに ? が含まれない場合は null を返す', () => {
    window.location.hash = '/result'
    expect(getDataFromUrl()).toBeNull()
  })

  it('data パラメータが無い場合は null を返す', () => {
    window.location.hash = '/result?id=abc'
    expect(getDataFromUrl()).toBeNull()
  })

  it('壊れたデータの場合は null を返す', () => {
    window.location.hash = '/result?data=invalid-string'
    expect(getDataFromUrl()).toBeNull()
  })

  it('構造が不正なデータの場合は null を返す', () => {
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify({ foo: 'bar' }))
    window.location.hash = `/result?data=${encoded}`
    expect(getDataFromUrl()).toBeNull()
  })
})

describe('getIdFromUrl', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('id パラメータがあれば返す', () => {
    window.location.hash = '/result?id=abc123'
    expect(getIdFromUrl()).toBe('abc123')
  })

  it('id パラメータが無い場合は null を返す', () => {
    window.location.hash = '/result?data=xxx'
    expect(getIdFromUrl()).toBeNull()
  })
})

describe('copyToClipboard', () => {
  const mockWriteText = vi.fn()

  beforeEach(() => {
    mockWriteText.mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('コピー成功時に true を返す', async () => {
    const result = await copyToClipboard('https://example.com')
    expect(result).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com')
  })

  it('コピー失敗時に false を返す', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText.mockRejectedValue(new Error('denied')) },
    })
    const result = await copyToClipboard('https://example.com')
    expect(result).toBe(false)
  })

  it('clipboard が未サポートの場合は false を返す', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined })
    const result = await copyToClipboard('https://example.com')
    expect(result).toBe(false)
  })
})
