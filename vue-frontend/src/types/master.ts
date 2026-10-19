type AnswerMaster = {
  id: number
  label: string
}

export type QuestionMaster = {
  id: number
  title: string
  prompt: string
  answers: AnswerMaster[]
}

export interface CategoryMaster {
  id: number
  key: string
  label: string
  description: string
  isCheckedByDefault: boolean
  questions: QuestionMaster[]
}
