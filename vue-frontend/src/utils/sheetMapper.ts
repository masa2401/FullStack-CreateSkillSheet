import type {
  AnswerSelection,
  CategorySelection,
  QuestionSelection,
  StarLevel,
  SurveyState,
} from '@/types'

interface AnswerDto {
  answerId: number
  value: number
}
interface QuestionDto {
  questionId: number
  answers: AnswerDto[]
}
interface CategoryDto {
  categoryId: number
  questions: QuestionDto[]
}

export interface SheetDto {
  userName: string
  categories: CategoryDto[]
}

// ─── 定数 ──────────────────────────────────────────────────────────

const STAR_LEVELS: readonly StarLevel[] = [1, 2, 3, 4, 5]
const toStarLevel = (value: number): StarLevel | undefined =>
  (STAR_LEVELS as readonly number[]).includes(value) ? (value as StarLevel) : undefined

// ─── SurveyState → SheetDto（保存時） ──────────────────────────────

export const toSheetDto = (state: SurveyState): SheetDto => ({
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
})

// ─── SheetDto → SurveyState（取得時） ──────────────────────────────

export const toSurveyState = (dto: SheetDto): SurveyState => ({
  userName: dto.userName,
  selections: dto.categories.map((cat): CategorySelection => ({
    categoryId: cat.categoryId,
    isChecked: true,
    questions: cat.questions.map((q): QuestionSelection => ({
      questionId: q.questionId,
      answers: q.answers.map((a): AnswerSelection => ({
        answerId: a.answerId,
        isChecked: true,
        value: toStarLevel(a.value),
      })),
    })),
  })),
})
