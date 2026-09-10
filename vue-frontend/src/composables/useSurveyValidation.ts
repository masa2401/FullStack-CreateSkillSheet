import { type ComputedRef, computed, ref } from 'vue'

import type { MergedCategory, ValidationError } from '@/types'

/** 未完成（チェック済みかつ習熟度未選択）の回答を、位置を特定できる形で表す内部型 */
type IncompleteAnswer = {
  categoryId: number
  questionId: number
  answerId: number
  category: string
  text: string
}

const isSameAnswer = (a: IncompleteAnswer, b: IncompleteAnswer): boolean =>
  a.categoryId === b.categoryId && a.questionId === b.questionId && a.answerId === b.answerId

export const useSurveyValidation = (mergedCategories: ComputedRef<MergedCategory[]>) => {
  const hasAttemptedSubmit = ref<boolean>(false)

  /** 直近の送信時に未完成として指摘した回答。エラー表示の対象をここに固定する */
  const flaggedAnswers = ref<IncompleteAnswer[]>([])

  /** 現時点で「チェック済みかつ習熟度未選択」の回答を列挙する */
  const collectIncomplete = (): IncompleteAnswer[] => {
    const incomplete: IncompleteAnswer[] = []
    mergedCategories.value.forEach((cat) => {
      if (!cat.isChecked) return
      cat.questions.forEach((q) => {
        q.answers.forEach((a) => {
          if (a.isChecked && !a.value) {
            incomplete.push({
              categoryId: cat.id,
              questionId: q.id,
              answerId: a.id,
              category: cat.label,
              text: q.title,
            })
          }
        })
      })
    })
    return incomplete
  }

  /**
   * 送信時に指摘した回答のうち、いまも未選択のものだけを返す。
   * エラーが減る方向のライブ更新は残り、増える方向は次の送信まで起きない。
   */
  const validationErrors = computed<ValidationError[]>(() =>
    collectIncomplete()
      .filter((item) => flaggedAnswers.value.some((flagged) => isSameAnswer(flagged, item)))
      .map(({ category, text }) => ({ category, text })),
  )

  const validate = (): boolean => {
    hasAttemptedSubmit.value = true
    flaggedAnswers.value = collectIncomplete()
    return flaggedAnswers.value.length === 0
  }

  /** 指定の設問で指摘済みの回答IDを返す。完成/未完成は問わない */
  const flaggedAnswerIdsOf = (categoryId: number, questionId: number): number[] =>
    flaggedAnswers.value
      .filter((flagged) => flagged.categoryId === categoryId && flagged.questionId === questionId)
      .map((flagged) => flagged.answerId)

  const isSubmitDisabled = computed(
    () => hasAttemptedSubmit.value && validationErrors.value.length > 0,
  )

  return {
    validationErrors,
    hasAttemptedSubmit,
    validate,
    isSubmitDisabled,
    flaggedAnswerIdsOf,
  }
}
