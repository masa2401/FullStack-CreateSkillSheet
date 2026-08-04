import type { CategorySelection, SurveyState } from '@/types'
import LZString from 'lz-string'

// ─── 型ガード ──────────────────────────────────────────────

const isCategoryState = (value: unknown): value is CategorySelection =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as CategorySelection).categoryId === 'number' &&
  typeof (value as CategorySelection).isChecked === 'boolean' &&
  Array.isArray((value as CategorySelection).questions)

const isSurveyState = (value: unknown): value is SurveyState =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SurveyState).userName === 'string' &&
  !!(value as SurveyState).userName &&
  Array.isArray((value as SurveyState).selections) &&
  (value as SurveyState).selections.every(isCategoryState)

// ─── データの圧縮・展開 ──────────────────────────────────────────

export const encodeData = (data: SurveyState): string | null => {
  try {
    const jsonString = JSON.stringify(data)
    return LZString.compressToEncodedURIComponent(jsonString)
  } catch (error) {
    console.error('エンコードエラー:', error)
    return null
  }
}

export const decodeData = (compressedString: string): SurveyState | null => {
  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(compressedString)
    if (!jsonString) {
      throw new Error('解凍に失敗しました')
    }
    return JSON.parse(jsonString) as SurveyState
  } catch (error) {
    console.error('デコードエラー:', error)
    return null
  }
}

// ─── URL生成・解析 ──────────────────────────────────────────

export const createShareUrl = (surveyData: SurveyState): string => {
  const encoded = encodeData(surveyData)
  if (!encoded) {
    throw new Error('データのエンコードに失敗しました')
  }
  const url = new URL(window.location.href)
  url.hash = `/result?data=${encoded}`
  url.search = ''

  return url.toString()
}

const getHashQueryParams = (): URLSearchParams | null => {
  const url = new URL(window.location.href)
  if (!url.hash || !url.hash.includes('?')) return null
  const [, hashQuery] = url.hash.split('?')
  if (!hashQuery) return null
  return new URLSearchParams(hashQuery)
}

export const getDataFromUrl = (): SurveyState | null => {
  try {
    const encodedData = getHashQueryParams()?.get('data')
    if (!encodedData) return null
    const decoded = decodeData(encodedData)
    if (!decoded) {
      console.error('データのデコードに失敗しました。URLが破損している可能性があります。')
      return null
    }
    if (!isSurveyState(decoded)) {
      console.error('デコードされたデータの構造が無効です')
      return null
    }
    console.info('URLからデータを正常に取得しました')
    return decoded
  } catch (error) {
    console.error('URLからのデータ取得中に予期しないエラーが発生しました:', error)
    return null
  }
}

export const getIdFromUrl = (): string | null => getHashQueryParams()?.get('id') ?? null

// ─── クリップボード操作 ──────────────────────────────────────────

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error('クリップボードコピーエラー:', error.message)
    }
    return false
  }
}
