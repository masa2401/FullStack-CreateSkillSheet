export type StarLevel = 1 | 2 | 3 | 4 | 5

export type AnswerSelection = {
  answerId: number
  isChecked: boolean
  value?: StarLevel
}

export type QuestionSelection = {
  questionId: number
  answers: AnswerSelection[]
}

export type CategorySelection = {
  categoryId: number
  isChecked: boolean
  questions: QuestionSelection[]
}

export interface SurveyState {
  userName: string
  selections: CategorySelection[]
}

/** 入力チェックのエラー1件。表示するコンポーネント（ValidationError.vue）と区別するため Item を付ける */
export interface ValidationErrorItem {
  categoryLabel: string
  questionTitle: string
}
