import type { LocationQuery } from 'vue-router'

import LZString from 'lz-string'

import type { CategorySelection, SurveyState } from '@/types'

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

/**
 * 結果ページ（`/#/result?...`）の URL を、現在のページを基準に組み立てる。
 * ID 方式の形式を変える場合は、Lambda に渡す URL を組み立てている
 * `LambdaPdfService.java`（`requestGenerationAsync` の `resultUrl`）も合わせて変更する。
 */
const buildResultUrl = (query: string): string => {
  const url = new URL(window.location.href)
  url.hash = `/result?${query}`
  url.search = ''
  return url.toString()
}

/** 共有リンク（クエリ方式）の URL。回答データそのものを圧縮して URL に含める */
export const createShareUrl = (surveyData: SurveyState): string => {
  const encoded = encodeData(surveyData)
  if (!encoded) {
    throw new Error('データのエンコードに失敗しました')
  }
  return buildResultUrl(`data=${encoded}`)
}

/** 共有リンク（ID 方式）の URL。バックエンドに保存したシートの ID だけを含める */
export const createShareUrlById = (id: string): string =>
  buildResultUrl(`id=${encodeURIComponent(id)}`)

/**
 * クエリの値を1つの文字列として取り出す。同名のキーが複数ある場合は先頭を使う。
 * クエリは vue-router が解析した `route.query` / `to.query` を受け取る。
 * `window.location` を読むと、ナビゲーションガードの中では遷移元の URL を見てしまうため。
 */
const firstQueryValue = (query: LocationQuery, key: string): string | null => {
  const value = query[key]
  return (Array.isArray(value) ? value[0] : value) ?? null
}

export const getDataFromQuery = (query: LocationQuery): SurveyState | null => {
  try {
    const encodedData = firstQueryValue(query, 'data')
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
    console.error('URLからのデータ取得エラー:', error)
    return null
  }
}

export const getIdFromQuery = (query: LocationQuery): string | null => firstQueryValue(query, 'id')

// ─── クリップボード操作 ──────────────────────────────────────────

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error('クリップボードコピーエラー:', error)
    }
    return false
  }
}
