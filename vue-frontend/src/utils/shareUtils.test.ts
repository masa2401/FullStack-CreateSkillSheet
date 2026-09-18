import LZString from 'lz-string'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SurveyState } from '@/types'

import {
  copyToClipboard,
  createShareUrl,
  decodeData,
  encodeData,
  getDataFromQuery,
  getIdFromQuery,
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

  it('JSON変換に失敗した場合、encodeDataはnullを返す', () => {
    const stringifySpy = vi.spyOn(JSON, 'stringify').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(encodeData(mockSurveyState)).toBeNull()
    stringifySpy.mockRestore()
  })

  it('encodeDataが失敗した場合、createShareUrlは例外を投げる', () => {
    const stringifySpy = vi.spyOn(JSON, 'stringify').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => createShareUrl(mockSurveyState)).toThrow('データのエンコードに失敗しました')
    stringifySpy.mockRestore()
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

describe('getDataFromQuery', () => {
  it('data パラメータがあればデコードして返す', () => {
    const encoded = encodeData(mockSurveyState)!
    expect(getDataFromQuery({ data: encoded })).toEqual(mockSurveyState)
  })

  it('同名のパラメータが複数ある場合は先頭の値を使う', () => {
    const encoded = encodeData(mockSurveyState)!
    expect(getDataFromQuery({ data: [encoded, 'invalid-string'] })).toEqual(mockSurveyState)
  })

  it('クエリが空の場合は null を返す', () => {
    expect(getDataFromQuery({})).toBeNull()
  })

  it('data パラメータが無い場合は null を返す', () => {
    expect(getDataFromQuery({ id: 'abc' })).toBeNull()
  })

  it('壊れたデータの場合は null を返す', () => {
    expect(getDataFromQuery({ data: 'invalid-string' })).toBeNull()
  })

  it('構造が不正なデータの場合は null を返す', () => {
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify({ foo: 'bar' }))
    expect(getDataFromQuery({ data: encoded })).toBeNull()
  })
})

describe('getIdFromQuery', () => {
  it('id パラメータがあれば返す', () => {
    expect(getIdFromQuery({ id: 'abc123' })).toBe('abc123')
  })

  it('同名のパラメータが複数ある場合は先頭の値を返す', () => {
    expect(getIdFromQuery({ id: ['abc123', 'def456'] })).toBe('abc123')
  })

  it('id パラメータが無い場合は null を返す', () => {
    expect(getIdFromQuery({ data: 'xxx' })).toBeNull()
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
