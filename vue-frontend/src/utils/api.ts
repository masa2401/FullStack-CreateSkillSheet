import type { SurveyData } from '@/types';
import { API_BASE, isBackendEnabled, toSurveyData, type SheetDto } from './sheetMapper';

export { isBackendEnabled, saveSheet } from './sheetMapper';

export const fetchSheet = async (id: string): Promise<SurveyData | null> => {
  if (!isBackendEnabled()) return null;
  const res = await fetch(`${API_BASE}/api/sheets/${id}`);
  if (!res.ok) return null;
  const dto = (await res.json()) as SheetDto;
  return toSurveyData(dto);
};

export const checkSheetExists = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/sheets/${id}`);
    return res.ok; // 200ならtrue、404ならfalse
  } catch {
    return false;
  }
};
