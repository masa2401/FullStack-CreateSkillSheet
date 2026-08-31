import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'

import { useMergedSurvey } from './useMergedSurvey'

describe('useMergedSurvey', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('マスターデータと結合してカテゴリの label が解決される', () => {
    const { mergedCategories } = useMergedSurvey()
    expect(mergedCategories.value[0]!.label).toBe('共通')
  })

  it('マスターデータと結合してカテゴリの key が解決される', () => {
    const { mergedCategories } = useMergedSurvey()
    expect(mergedCategories.value[0]!.key).toBe('common')
  })

  it('初期状態では全カテゴリが mergedCategories に含まれる', () => {
    const { mergedCategories } = useMergedSurvey()
    expect(mergedCategories.value).toHaveLength(3)
  })

  it('初期状態では共通カテゴリのみ isChecked: true', () => {
    const { mergedCategories } = useMergedSurvey()
    const checkedCategories = mergedCategories.value.filter((c) => c.isChecked)
    expect(checkedCategories).toHaveLength(1)
    expect(checkedCategories[0]!.label).toBe('共通')
  })

  it('setCategoryChecked でカテゴリの isChecked が反映される', () => {
    const store = useSurveyStore()
    const { mergedCategories } = useMergedSurvey()

    store.setCategoryChecked(2, true)
    const engineer = mergedCategories.value.find((c) => c.id === 2)
    expect(engineer!.isChecked).toBe(true)
  })

  it('setAnswerSelection で回答の isChecked が反映される', () => {
    const store = useSurveyStore()
    const { mergedCategories } = useMergedSurvey()

    store.setAnswerSelection(1, 1, 1, { isChecked: true })
    const answer = mergedCategories.value[0]!.questions[0]!.answers[0]!
    expect(answer.isChecked).toBe(true)
  })

  it('setAnswerSelection で回答の value が反映される', () => {
    const store = useSurveyStore()
    const { mergedCategories } = useMergedSurvey()

    store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 4 })
    const answer = mergedCategories.value[0]!.questions[0]!.answers[0]!
    expect(answer.value).toBe(4)
  })

  it('質問のタイトルと設問文がマスターデータから解決される', () => {
    const { mergedCategories } = useMergedSurvey()
    const question = mergedCategories.value[0]!.questions[0]!
    expect(typeof question.title).toBe('string')
    expect(question.title.length).toBeGreaterThan(0)
    expect(typeof question.prompt).toBe('string')
    expect(question.prompt.length).toBeGreaterThan(0)
  })

  it('回答ラベルがマスターデータから解決される', () => {
    const { mergedCategories } = useMergedSurvey()
    const label = mergedCategories.value[0]!.questions[0]!.answers[0]!.label
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })
})
