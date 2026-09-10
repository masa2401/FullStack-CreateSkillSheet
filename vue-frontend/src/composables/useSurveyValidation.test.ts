import { computed, nextTick, ref } from 'vue'

import { describe, expect, it } from 'vitest'

import type { MergedCategory, StarLevel } from '@/types'

import { useSurveyValidation } from './useSurveyValidation'

const makeCategory = (overrides?: Partial<MergedCategory>): MergedCategory => ({
  id: 1,
  label: '共通',
  key: 'common',
  isChecked: true,
  questions: [
    {
      id: 1,
      title: 'テスト質問',
      prompt: '当てはまるものを選択してください。',
      answers: [{ id: 1, label: 'テスト回答', isChecked: false, value: undefined }],
    },
  ],
  ...overrides,
})

type AnswerFixture = { id: number; label: string; isChecked: boolean; value?: StarLevel }

/** 1カテゴリ・1設問に任意の回答群を持たせたカテゴリを作る */
const makeSingleQuestion = (answers: AnswerFixture[]): MergedCategory =>
  makeCategory({
    questions: [
      { id: 1, title: 'テスト質問', prompt: '当てはまるものを選択してください。', answers },
    ],
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
            title: 'テスト質問',
            prompt: '当てはまるものを選択してください。',
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
            title: 'テスト質問',
            prompt: '当てはまるものを選択してください。',
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
            title: 'テスト質問',
            prompt: '当てはまるものを選択してください。',
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
            title: 'テスト質問',
            prompt: '当てはまるものを選択してください。',
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
            title: 'テスト質問',
            prompt: '当てはまるものを選択してください。',
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

  // ─── 送信後にエラーが増えないこと ────────────────────────────────

  it('送信後に新しくチェックを入れてもエラーは増えない', async () => {
    const categories = ref([
      makeSingleQuestion([
        { id: 1, label: '回答A', isChecked: true, value: undefined },
        { id: 2, label: '回答B', isChecked: false, value: undefined },
      ]),
    ])
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(validationErrors.value).toHaveLength(1)

    categories.value = [
      makeSingleQuestion([
        { id: 1, label: '回答A', isChecked: true, value: undefined },
        { id: 2, label: '回答B', isChecked: true, value: undefined },
      ]),
    ]
    await nextTick()
    expect(validationErrors.value).toHaveLength(1)
  })

  it('送信前にチェックを入れただけではエラーにならない', async () => {
    const categories = ref([
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: false, value: undefined }]),
    ])
    const { validationErrors, isSubmitDisabled } = useSurveyValidation(
      computed(() => categories.value),
    )

    categories.value = [
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: true, value: undefined }]),
    ]
    await nextTick()

    expect(validationErrors.value).toHaveLength(0)
    expect(isSubmitDisabled.value).toBe(false)
  })

  it('指摘済みの回答のチェックを外すとエラーが消え、入れ直すと再び現れる', async () => {
    const categories = ref([
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: true, value: undefined }]),
    ])
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(validationErrors.value).toHaveLength(1)

    categories.value = [
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: false, value: undefined }]),
    ]
    await nextTick()
    expect(validationErrors.value).toHaveLength(0)

    categories.value = [
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: true, value: undefined }]),
    ]
    await nextTick()
    expect(validationErrors.value).toHaveLength(1)
  })

  // ─── flaggedAnswerIdsOf ──────────────────────────────────────

  it('送信前は flaggedAnswerIdsOf が空配列を返す', () => {
    const categories = ref([
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: true, value: undefined }]),
    ])
    const { flaggedAnswerIdsOf } = useSurveyValidation(computed(() => categories.value))

    expect(flaggedAnswerIdsOf(1, 1)).toEqual([])
  })

  it('flaggedAnswerIdsOf は送信時に未完成だった回答IDだけを返す', () => {
    const categories = ref([
      makeSingleQuestion([
        { id: 1, label: '回答A', isChecked: true, value: undefined },
        { id: 2, label: '回答B', isChecked: true, value: 3 },
        { id: 3, label: '回答C', isChecked: false, value: undefined },
      ]),
    ])
    const { validate, flaggedAnswerIdsOf } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(flaggedAnswerIdsOf(1, 1)).toEqual([1])
  })

  it('flaggedAnswerIdsOf は指定した設問以外の回答IDを混ぜない', () => {
    const categories = ref([
      makeCategory({
        questions: [
          {
            id: 1,
            title: '質問1',
            prompt: '当てはまるものを選択してください。',
            answers: [{ id: 1, label: '回答A', isChecked: true, value: undefined }],
          },
          {
            id: 2,
            title: '質問2',
            prompt: '当てはまるものを選択してください。',
            answers: [{ id: 1, label: '回答B', isChecked: true, value: undefined }],
          },
        ],
      }),
    ])
    const { validate, flaggedAnswerIdsOf } = useSurveyValidation(computed(() => categories.value))

    validate()
    expect(flaggedAnswerIdsOf(1, 1)).toEqual([1])
    expect(flaggedAnswerIdsOf(1, 2)).toEqual([1])
    expect(flaggedAnswerIdsOf(2, 1)).toEqual([])
  })

  it('flaggedAnswerIdsOf は習熟度を選択した後もIDを返し続ける', async () => {
    const categories = ref([
      makeSingleQuestion([{ id: 1, label: '回答A', isChecked: true, value: undefined }]),
    ])
    const { validate, flaggedAnswerIdsOf } = useSurveyValidation(computed(() => categories.value))

    validate()
    categories.value = [makeSingleQuestion([{ id: 1, label: '回答A', isChecked: true, value: 3 }])]
    await nextTick()

    expect(flaggedAnswerIdsOf(1, 1)).toEqual([1])
  })
})
