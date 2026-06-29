import type { SurveyState } from '@/types';
import { toSheetDto, toSurveyState, type SheetDto } from './sheetMapper';

const getApiBase = (): string => import.meta.env.VITE_API_BASE_URL;
export const isBackendEnabled = (): boolean => !!getApiBase();

export type FetchSheetResult =
  | { status: 'success'; data: SurveyState }
  | { status: 'expired' }
  | { status: 'notfound' };

export const saveSheet = async (state: SurveyState): Promise<string | null> => {
  if (!isBackendEnabled()) return null;

  const res = await fetch(`${getApiBase()}/api/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSheetDto(state)),
  });
  if (!res.ok) throw new Error('保存に失敗しました');
  const { id } = await res.json();
  return id;
};

export const fetchSheet = async (id: string): Promise<FetchSheetResult | null> => {
  if (!isBackendEnabled()) return null;
  try {
    const res = await fetch(`${getApiBase()}/api/sheets/${id}`);
    if (res.status === 410) return { status: 'expired' };
    if (!res.ok) return { status: 'notfound' };
    const dto = (await res.json()) as SheetDto;
    return { status: 'success', data: toSurveyState(dto) };
  } catch {
    return null;
  }
};

export const checkSheetExists = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBase()}/api/sheets/${id}`);
    return res.ok;
  } catch {
    return false;
  }
};
