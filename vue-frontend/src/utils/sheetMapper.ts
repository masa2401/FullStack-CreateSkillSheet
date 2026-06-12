import type { CategoryState, StarLevel, SurveyData } from '@/types';
import { CATEGORIES } from './constants';

interface AnswerDto {
  label: string;
  value: number;
}
interface QuestionDto {
  id: number;
  questionText: string;
  answers: AnswerDto[];
}
interface CategoryDto {
  id: number;
  genre: string;
  questions: QuestionDto[];
}

export interface SheetDto {
  userName: string;
  categories: CategoryDto[];
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const isBackendEnabled = (): boolean => !!API_BASE;

// ─── カテゴリIDからアイコンを復元するためのマップ ───────────────
const CATEGORY_ICON_BY_ID: Record<number, string> = Object.fromEntries(
  Object.values(CATEGORIES).map((c) => [c.id, c.icon]),
);
// 想定外の id が来た場合のフォールバック（共通カテゴリのアイコンを流用）
const FALLBACK_ICON = CATEGORIES.COMMON.icon;

const getCategoryIcon = (id: number): string => CATEGORY_ICON_BY_ID[id] ?? FALLBACK_ICON;

const STAR_LEVELS: readonly StarLevel[] = [1, 2, 3, 4, 5];
const toStarLevel = (value: number): StarLevel | undefined =>
  (STAR_LEVELS as readonly number[]).includes(value) ? (value as StarLevel) : undefined;

export const saveSheet = async (data: SurveyData): Promise<string | null> => {
  if (!isBackendEnabled()) return null;
  const requestBody: SheetDto = {
    userName: data.userName,
    categories: data.categories
      .filter((cat) => cat.isChecked)
      .map((cat) => ({
        id: cat.id,
        genre: cat.genre,
        questions: cat.questions
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            answers: q.answers
              .filter((a) => a.isChecked && a.value !== undefined)
              .map((a) => ({
                label: a.label,
                value: a.value as number,
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

// DTO → SurveyData への変換（fetchSheet専用）
export const toSurveyData = (dto: SheetDto): SurveyData => ({
  userName: dto.userName,
  categories: dto.categories.map(
    (cat): CategoryState => ({
      id: cat.id,
      genre: cat.genre,
      icon: getCategoryIcon(cat.id),
      isChecked: true, // ← DTOに存在する＝保存時にチェック済みだったので true で復元
      questions: cat.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        answers: q.answers.map((a) => ({
          label: a.label,
          isChecked: true,
          value: toStarLevel(a.value),
        })),
      })),
    }),
  ),
});
