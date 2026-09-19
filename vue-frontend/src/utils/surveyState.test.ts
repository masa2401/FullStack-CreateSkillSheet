import { describe, expect, it } from 'vitest'

import { CATEGORY_MASTERS } from '@/data/questions'
import type { SurveyState } from '@/types'

import { buildInitialSelections, normalizeSurveyState } from './surveyState'

const findAnswer = (state: SurveyState, categoryId: number, questionId: number, answerId: number) =>
  state.selections
    .find((s) => s.categoryId === categoryId)
    ?.questions.find((q) => q.questionId === questionId)
    ?.answers.find((a) => a.answerId === answerId)

describe('buildInitialSelections', () => {
  it('マスターデータの数だけ、マスタの順に selections が作られる', () => {
    const selections = buildInitialSelections()
    expect(selections.map((s) => s.categoryId)).toEqual(CATEGORY_MASTERS.map((m) => m.id))
  })

  it('isCheckedByDefault: true のカテゴリのみ isChecked: true になる', () => {
    const checked = buildInitialSelections().filter((s) => s.isChecked)
    expect(checked.map((s) => s.categoryId)).toEqual(
      CATEGORY_MASTERS.filter((m) => m.isCheckedByDefault).map((m) => m.id),
    )
  })
})

describe('normalizeSurveyState', () => {
  it('userName がそのまま引き継がれる', () => {
    const result = normalizeSurveyState({ userName: '山田太郎', selections: [] })
    expect(result.userName).toBe('山田太郎')
  })

  it('受け取った isChecked / value が反映される', () => {
    const result = normalizeSurveyState({
      userName: '山田太郎',
      selections: [
        {
          categoryId: 1,
          isChecked: true,
          questions: [{ questionId: 1, answers: [{ answerId: 1, isChecked: true, value: 4 }] }],
        },
      ],
    })

    const answer = findAnswer(result, 1, 1, 1)!
    expect(answer.isChecked).toBe(true)
    expect(answer.value).toBe(4)
  })

  it('受け取っていないカテゴリ・回答は、マスタに沿った未回答の状態で補われる', () => {
    const result = normalizeSurveyState({ userName: '山田太郎', selections: [] })

    expect(result.selections).toEqual(buildInitialSelections())
  })

  it('受け取った順序に関わらず、マスタの順に並べ直される', () => {
    const result = normalizeSurveyState({
      userName: '山田太郎',
      selections: [
        {
          categoryId: 1,
          isChecked: true,
          questions: [
            { questionId: 2, answers: [{ answerId: 1, isChecked: true, value: 2 }] },
            { questionId: 1, answers: [{ answerId: 1, isChecked: true, value: 3 }] },
          ],
        },
      ],
    })

    const common = result.selections.find((s) => s.categoryId === 1)!
    expect(common.questions.map((q) => q.questionId)).toEqual(
      CATEGORY_MASTERS.find((m) => m.id === 1)!.questions.map((q) => q.id),
    )
    expect(findAnswer(result, 1, 2, 1)!.value).toBe(2)
    expect(findAnswer(result, 1, 1, 1)!.value).toBe(3)
  })

  it('マスターデータに存在しない categoryId / questionId / answerId は捨てられる', () => {
    const result = normalizeSurveyState({
      userName: '山田太郎',
      selections: [
        { categoryId: 999, isChecked: true, questions: [] },
        {
          categoryId: 1,
          isChecked: true,
          questions: [
            { questionId: 999, answers: [{ answerId: 1, isChecked: true, value: 3 }] },
            { questionId: 1, answers: [{ answerId: 999, isChecked: true, value: 3 }] },
          ],
        },
      ],
    })

    expect(result.selections.some((s) => s.categoryId === 999)).toBe(false)
    expect(findAnswer(result, 1, 999, 1)).toBeUndefined()
    expect(findAnswer(result, 1, 1, 999)).toBeUndefined()
  })

  it('受け取ったデータを書き換えない', () => {
    const input: SurveyState = {
      userName: '山田太郎',
      selections: [
        {
          categoryId: 1,
          isChecked: true,
          questions: [{ questionId: 1, answers: [{ answerId: 1, isChecked: true, value: 4 }] }],
        },
      ],
    }
    const snapshot = JSON.stringify(input)

    normalizeSurveyState(input)

    expect(JSON.stringify(input)).toBe(snapshot)
  })
})
