import type { SurveyData } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const isBackendEnable = (): boolean => !!API_BASE;

export const saveSheet = async (data: SurveyData): Promise<string | null> => {
    if(!isBackendEnable()) return null;
    const res = await fetch(`${API_BASE}/api/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(!res.ok) throw new Error('保存に失敗しました');
    const { id } = await res.json();
    return id
}

export const fetchSheet = async (id: string): Promise<SurveyData | null> => {
    if (!isBackendEnable()) return null;
    const res = await fetch(`${API_BASE}/api/sheets/${id}`);
    if (!res.ok) return null;
    return res.json();
}