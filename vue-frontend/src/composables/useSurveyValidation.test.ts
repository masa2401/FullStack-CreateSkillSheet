import type { MergedCategory } from '@/types';
import { describe, expect, it } from 'vitest';
import { computed, ref } from 'vue';
import { useSurveyValidation } from './useSurveyValidation';

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
});

describe('userSurveyValidation', () => {
  it('チェックなしの回答はエラーにならない', () => {
    const categories = ref([makeCategory()]);
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value));

    validate();
    expect(validationErrors.value).toHaveLength(0);
  });

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
    ]);
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value));

    validate();
    expect(validationErrors.value).toHaveLength(1);
    expect(validationErrors.value[0]!.category).toBe('共通');
  });

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
    ]);
    const { validate, validationErrors } = useSurveyValidation(computed(() => categories.value));

    validate();
    expect(validationErrors.value).toHaveLength(0);
  });
});
