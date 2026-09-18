import type { SurveyState } from '@/types'

import { type SheetDto, toSheetDto, toSurveyState } from './sheetMapper'

const getApiBase = (): string => import.meta.env.VITE_API_BASE_URL

export type FetchSheetResult =
  | { status: 'success'; data: SurveyState }
  | { status: 'expired'; expiryDays: number }
  | { status: 'notfound' }
  | { status: 'error' }

/** バックエンドが返すPDFの生成状況 */
type PdfStatusBody = { status: 'generating' } | { status: 'ready'; downloadUrl: string }

/**
 * `retryable` は、同じリクエストをやり直す価値があるかを表す。
 * 5xx と通信エラーは一時的な不調（Railwayの起床中など）とみなして true、
 * 4xx は内容を直さない限り結果が変わらないため false にする。
 * 429 は待てば通る4xxだが、PDF系のエンドポイントはレート制限の対象外のため区別しない。
 */
export type PdfStatusResult = PdfStatusBody | { status: 'failed'; retryable: boolean }

export type RegenerateResult = { status: 'accepted' } | { status: 'failed'; retryable: boolean }

const failedResult = (httpStatus: number): { status: 'failed'; retryable: boolean } => ({
  status: 'failed',
  retryable: httpStatus >= 500,
})

export const isBackendEnabled = (): boolean => !!getApiBase()

export const saveSheet = async (state: SurveyState): Promise<string | null> => {
  if (!isBackendEnabled()) return null

  const res = await fetch(`${getApiBase()}/api/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSheetDto(state)),
  })
  if (!res.ok) throw new Error('保存に失敗しました')
  const { id } = await res.json()
  return id
}

export const fetchSheet = async (id: string): Promise<FetchSheetResult> => {
  if (!isBackendEnabled()) return { status: 'error' }
  try {
    const res = await fetch(`${getApiBase()}/api/sheets/${id}`)
    if (res.status === 410) {
      const body = await res.json()
      return { status: 'expired', expiryDays: body.expiryDays }
    }
    if (res.status === 404) return { status: 'notfound' }
    if (!res.ok) return { status: 'error' }
    const dto = (await res.json()) as SheetDto
    return { status: 'success', data: toSurveyState(dto) }
  } catch {
    return { status: 'error' }
  }
}

export const checkSheetExists = async (id: string): Promise<boolean> => {
  if (!isBackendEnabled()) return false
  try {
    const res = await fetch(`${getApiBase()}/api/sheets/${id}`)
    return res.ok
  } catch {
    return false
  }
}

export const fetchPdfStatus = async (id: string): Promise<PdfStatusResult> => {
  if (!isBackendEnabled()) return { status: 'failed', retryable: false }
  try {
    const res = await fetch(`${getApiBase()}/api/pdf/${id}/status`)
    if (!res.ok) return failedResult(res.status)
    return (await res.json()) as PdfStatusBody
  } catch {
    return { status: 'failed', retryable: true }
  }
}

export const regeneratePdf = async (id: string): Promise<RegenerateResult> => {
  if (!isBackendEnabled()) return { status: 'failed', retryable: false }
  try {
    const res = await fetch(`${getApiBase()}/api/pdf/${id}/regenerate`, { method: 'POST' })
    if (!res.ok) return failedResult(res.status)
    return { status: 'accepted' }
  } catch {
    return { status: 'failed', retryable: true }
  }
}
