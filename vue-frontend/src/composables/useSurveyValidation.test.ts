import { computed, nextTick, ref } from 'vue'

import { describe, expect, it } from 'vitest'

import type { MergedCategory } from '@/types'

import { useSurveyValidation } from './useSurveyValidation'

const makeCategory = (overrides?: Partial<MergedCategory>): MergedCategory => ({
  id: 1,
  label: '共通',
  icon: 'fa-solid fa-briefcase',
  isChecked: true,
  questions: [
    {
      id: 1,
      questionText: 'Q1. テスト質問',
      answers: [{ id: 1, label: 'テスト回答', isChecked: false, value: undefined }],
    },
  ],
  ...overrides,
})

describe('userSurveyValidation', () => {
  it('初期状態ではエラーがない', () => {
    const categories = ref([makeCategory()])
    const { validationErrors } = useSurveyValidation(computed(() => categories.value))
    expect(validationErrors.value).toHaveLength(0)
  })

  it('初期状態では hasAttemptedSubmit が false', () => {
    const categories = ref([makeCategory()])
    const { hasAttemptedSubmit } = useSurveyValidation(computed(() => categories.value))
    expect(hasAttemptedSubmit.value).toBe(false)
  })

  it('validate を呼ぶと hasAttemptedSubmit が true になる', () => {
    const categories = ref([makeCategory()])
    const { validate, hasAttemptedSubmit } = useSurveyValidation(computed(() => categories.value))
    validate()
    expect(hasAttemptedSubmit.value).toBe(true)
  })

  it('チェックなしの回答はエラーにならない', () => {
    const categories = ref([makeCategory()])
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(validationErrors.value).toHaveLength(0)
  })

  it('チェックありで習熟度未選択はエラーになる', () => {
    const categories = ref([
      makeCategory({
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ id: 1, label: 'テスト回答', isChecked: true, value: undefined }],
          },
        ],
      }),
    ])
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(validationErrors.value).toHaveLength(1)
    expect(validationErrors.value[0]!.category).toBe('共通')
  })

  it('isChecked が false のカテゴリはバリデーション対象外', () => {
    const categories = ref([
      makeCategory({
        isChecked: false,
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ id: 1, label: 'テスト回答', isChecked: true, value: undefined }],
          },
        ],
      }),
    ])
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(validationErrors.value).toHaveLength(0)
  })

  it('送信後に習熟度を選択するとエラーがリアルタイムで消える', async () => {
    const categories = ref([
      makeCategory({
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ id: 1, label: 'テスト回答', isChecked: true, value: undefined }],
          },
        ],
      }),
    ])
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(validationErrors.value).toHaveLength(1)

    categories.value = [
      makeCategory({
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ id: 1, label: 'テスト回答', isChecked: true, value: 3 }],
          },
        ],
      }),
    ]
    await nextTick()
    expect(validationErrors.value).toHaveLength(0)
  })

  it('isSubmitDisabled は送信試行後にエラーがある場合のみ true になる', () => {
    const categories = ref([
      makeCategory({
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ id: 1, label: 'テスト回答', isChecked: true, value: undefined }],
          },
        ],
      }),
    ])
    const { validate, isSubmitDisabled } = useSurveyValidation(computed(() => categories.value))

    expect(isSubmitDisabled.value).toBe(false)
    validate()
    expect(isSubmitDisabled.value).toBe(true)
  })
})
