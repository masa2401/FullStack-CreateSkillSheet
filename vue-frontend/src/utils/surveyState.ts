import { CATEGORY_MASTERS } from '@/data/questions'
import type { AnswerSelection, CategorySelection, QuestionSelection, SurveyState } from '@/types'

/** 指定カテゴリの設問を、マスタの順に未回答の状態で組み立てる */
export const buildQuestionsForCategory = (categoryId: number): QuestionSelection[] => {
  const master = CATEGORY_MASTERS.find((m) => m.id === categoryId)!
  return master.questions.map((q): QuestionSelection => ({
    questionId: q.id,
    answers: q.answers.map((a): AnswerSelection => ({
      answerId: a.id,
      isChecked: false,
      value: undefined,
    })),
  }))
}

/** 全カテゴリを、マスタの順に未回答の状態で組み立てる */
export const buildInitialSelections = (): CategorySelection[] =>
  CATEGORY_MASTERS.map((master): CategorySelection => ({
    categoryId: master.id,
    isChecked: master.isCheckedByDefault,
    questions: buildQuestionsForCategory(master.id),
  }))

/**
 * 外部から受け取ったシート（共有リンクのデータ）を、マスタの形にそろえる。
 * 未回答の初期状態に受け取った値を重ねるため、並びはマスタの順になり、
 * マスタに存在しないカテゴリ・設問・回答の ID は捨てられる。
 * バックエンドは設問の並びを保証しないこと、マスタ変更前に保存されたシートに
 * 現在は無い ID が含まれうることへの対策。
 */
export const normalizeSurveyState = (state: SurveyState): SurveyState => {
  const selections = buildInitialSelections()

  state.selections.forEach((incoming) => {
    const sel = selections.find((s) => s.categoryId === incoming.categoryId)
    if (!sel) return
    sel.isChecked = incoming.isChecked

    incoming.questions.forEach((incomingQ) => {
      const qSel = sel.questions.find((q) => q.questionId === incomingQ.questionId)
      if (!qSel) return

      incomingQ.answers.forEach((incomingA) => {
        const aSel = qSel.answers.find((a) => a.answerId === incomingA.answerId)
        if (!aSel) return
        aSel.isChecked = incomingA.isChecked
        aSel.value = incomingA.value
      })
    })
  })

  return { userName: state.userName, selections }
}
