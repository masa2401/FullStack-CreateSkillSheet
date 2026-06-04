import type { SurveyData } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const isBackendEnabled = (): boolean => !!API_BASE;

export const saveSheet = async (data: SurveyData): Promise<string | null> => {
  if (!isBackendEnabled()) return null;

  // バックエンドのDTO形式に変換
  const requestBody = {
    userName: data.userName,
    categories: data.categories
      .filter((cat) => cat.isChecked)
      .map((cat) => ({
        id: cat.id,
        genre: cat.genre,
        icon: cat.icon,
        questions: cat.questions
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            answers: q.answers
              .filter((a) => a.isChecked)
              .map((a) => ({
                label: a.label,
                value: a.value ?? null,
              })),
          }))
          .filter((q) => q.answers.length > 0),
      })),
  };

  const res = await fetch(`${API_BASE}/api/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) throw new Error('保存に失敗しました');
  const { id } = await res.json();
  return id;
};

export const fetchSheet = async (id: string): Promise<SurveyData | null> => {
  if (!isBackendEnabled()) return null;
  const res = await fetch(`${API_BASE}/api/sheets/${id}`);
  if (!res.ok) return null;
  return res.json();
};
