import type {
  AnswerSelection,
  CategorySelection,
  QuestionSelection,
  StarLevel,
  SurveyState,
} from '@/types';

interface AnswerDto {
  answerId: number;
  value: number;
}
interface QuestionDto {
  questionId: number;
  answers: AnswerDto[];
}
interface CategoryDto {
  categoryId: number;
  questions: QuestionDto[];
}

export interface SheetDto {
  userName: string;
  categories: CategoryDto[];
}

// ─── 定数 ──────────────────────────────────────────────────────────

export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const isBackendEnabled = (): boolean => !!API_BASE;

const STAR_LEVELS: readonly StarLevel[] = [1, 2, 3, 4, 5];
const toStarLevel = (value: number): StarLevel | undefined =>
  (STAR_LEVELS as readonly number[]).includes(value) ? (value as StarLevel) : undefined;

// ─── SurveyState → SheetDto（保存時） ──────────────────────────────

/**
 * SurveyState（状態のみ）をSheetDtoに変換する。
 * label / questionText はマスターデータから引き当てて付与する。
 * バックエンドのスキーマは変えないため、DTOの形は変わらない。
 */
const toSheetDto = (state: SurveyState): SheetDto => ({
  userName: state.userName,
  categories: state.selections
    .filter((sel) => sel.isChecked)
    .map((sel) => ({
      categoryId: sel.categoryId,
      questions: sel.questions
        .map((q) => ({
          questionId: q.questionId,
          answers: q.answers
            .filter((a) => a.isChecked && a.value !== undefined)
            .map((a) => ({
              answerId: a.answerId,
              value: a.value as number,
            })),
        }))
        .filter((q) => q.answers.length > 0),
    })),
});

export const saveSheet = async (state: SurveyState): Promise<string | null> => {
  if (!isBackendEnabled()) return null;

  const res = await fetch(`${API_BASE}/api/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSheetDto(state)),
  });
  if (!res.ok) throw new Error('保存に失敗しました');
  const { id } = await res.json();
  return id;
};

// ─── SheetDto → SurveyState（取得時） ──────────────────────────────

/**
 * バックエンドから取得したSheetDtoをSurveyStateに変換する。
 * DTOのlabel/questionTextでマスターデータのIDを逆引きして、
 * AnswerSelection / QuestionSelection を組み立てる。
 *
 * マスターデータに存在しないlabel/questionTextは無視する。
 * （バックエンドの質問を将来編集可能にした際の差分吸収）
 */
export const toSurveyState = (dto: SheetDto): SurveyState => ({
  userName: dto.userName,
  selections: dto.categories.map(
    (cat): CategorySelection => ({
      categoryId: cat.categoryId,
      isChecked: true,
      questions: cat.questions.map(
        (q): QuestionSelection => ({
          questionId: q.questionId,
          answers: q.answers.map(
            (a): AnswerSelection => ({
              answerId: a.answerId,
              isChecked: true,
              value: toStarLevel(a.value),
            }),
          ),
        }),
      ),
    }),
  ),
});
