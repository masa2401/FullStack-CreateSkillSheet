import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useSurveyValidation } from './useSurveyValidation';
import type { Category } from '@/types';

const makeCategory = (overrides?: Partial<Category>) => ({
  id: 1,
  genre: '共通の質問',
  isChecked: true,
  questions: [
    {
      id: 1,
      questionText: 'Q1. テスト質問',
      answers: [{ label: 'テスト回答', isChecked: false }],
    },
  ],
  ...overrides,
});

describe('userSurveyValidation', () => {
  it('チェックなしの回答はエラーにならない', () => {
    const categoryData = ref([makeCategory()]);
    const { validate, validationErrors } = useSurveyValidation(categoryData);

    validate();

    expect(validationErrors.value).toHaveLength(0);
  });

  it('チェックありで習熟度未選択はエラーになる', () => {
    const categoryData = ref([
      makeCategory({
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ label: 'テスト回答', isChecked: true }] /* answers.value無し */,
          },
        ],
      }),
    ]);
    const { validate, validationErrors } = useSurveyValidation(categoryData);

    validate();

    expect(validationErrors.value).toHaveLength(1);
    expect(validationErrors.value[0]!.category).toBe('共通の質問');
  });

  it('isChecked が false のカテゴリはバリデーション対象外', () => {
    const categoryData = ref([
      makeCategory({
        isChecked: false, //カテゴリ自体が非選択
        questions: [
          {
            id: 1,
            questionText: 'Q1. テスト質問',
            answers: [{ label: 'テスト回答', isChecked: true }],
          },
        ],
      }),
    ]);
    const { validate, validationErrors } = useSurveyValidation(categoryData);

    validate();

    expect(validationErrors.value).toHaveLength(0);
  });
});
