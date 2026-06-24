import type { SurveyState } from '@/types';
import { API_BASE, isBackendEnabled, toSurveyState, type SheetDto } from './sheetMapper';

export { isBackendEnabled, saveSheet } from './sheetMapper';

export type FetchSheetResult =
  | { status: 'success'; data: SurveyState }
  | { status: 'expired' }
  | { status: 'notfound' };

export const fetchSheet = async (id: string): Promise<FetchSheetResult | null> => {
  if (!isBackendEnabled()) return null;
  const res = await fetch(`${API_BASE}/api/sheets/${id}`);
  if (res.status === 410) return { status: 'expired' };
  if (!res.ok) return { status: 'notfound' };
  const dto = (await res.json()) as SheetDto;
  return { status: 'success', data: toSurveyState(dto) };
};

export const checkSheetExists = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/sheets/${id}`);
    return res.ok;
  } catch {
    return false;
  }
};
