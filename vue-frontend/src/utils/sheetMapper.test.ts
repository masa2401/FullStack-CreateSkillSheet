import type { SurveyState } from '@/types';
import { describe, expect, it } from 'vitest';
import { toSheetDto, toSurveyState } from './sheetMapper';

const mockSurveyState: SurveyState = {
  userName: 'テストユーザー',
  selections: [
    {
      categoryId: 1,
      isChecked: true,
      questions: [
        {
          questionId: 1,
          answers: [
            { answerId: 1, isChecked: true, value: 3 },
            { answerId: 2, isChecked: false, value: undefined },
          ],
        },
        {
          questionId: 2,
          answers: [{ answerId: 1, isChecked: false, value: undefined }],
        },
      ],
    },
    {
      categoryId: 2,
      isChecked: false,
      questions: [
        {
          questionId: 1,
          answers: [{ answerId: 1, isChecked: true, value: 5 }],
        },
      ],
    },
  ],
};

describe('toSheetDto', () => {
  it('userName が正しく変換される', () => {
    const dto = toSheetDto(mockSurveyState);
    expect(dto.userName).toBe('テストユーザー');
  });

  it('isChecked: false のカテゴリは除外される', () => {
    const dto = toSheetDto(mockSurveyState);
    expect(dto.categories).toHaveLength(1);
    expect(dto.categories[0]!.categoryId).toBe(1);
  });

  it('isChecked: false の回答は除外される', () => {
    const dto = toSheetDto(mockSurveyState);
    const answers = dto.categories[0]!.questions[0]!.answers;
    expect(answers).toHaveLength(1);
    expect(answers[0]!.answerId).toBe(1);
  });

  it('value が undefined の回答は除外される', () => {
    const state: SurveyState = {
      userName: 'テスト',
      selections: [
        {
          categoryId: 1,
          isChecked: true,
          questions: [
            {
              questionId: 1,
              answers: [{ answerId: 1, isChecked: true, value: undefined }],
            },
          ],
        },
      ],
    };
    const dto = toSheetDto(state);
    expect(dto.categories[0]!.questions).toHaveLength(0);
  });

  it('回答が0件の質問は除外される', () => {
    const dto = toSheetDto(mockSurveyState);
    expect(dto.categories[0]!.questions).toHaveLength(1);
    expect(dto.categories[0]!.questions[0]!.questionId).toBe(1);
  });

  it('value が正しく変換される', () => {
    const dto = toSheetDto(mockSurveyState);
    expect(dto.categories[0]!.questions[0]!.answers[0]!.value).toBe(3);
  });
});

describe('toSurveyState', () => {
  it('userName が正しく変換される', () => {
    const dto = {
      userName: 'テストユーザー',
      categories: [
        {
          categoryId: 1,
          questions: [
            {
              questionId: 1,
              answers: [{ answerId: 1, value: 3 }],
            },
          ],
        },
      ],
    };
    const state = toSurveyState(dto);
    expect(state.userName).toBe('テストユーザー');
  });

  it('カテゴリの isChecked は常に true になる', () => {
    const dto = {
      userName: 'テストユーザー',
      categories: [{ categoryId: 1, questions: [] }],
    };
    const state = toSurveyState(dto);
    expect(state.selections[0]!.isChecked).toBe(true);
  });

  it('回答の isChecked は常に true になる', () => {
    const dto = {
      userName: 'テストユーザー',
      categories: [
        {
          categoryId: 1,
          questions: [
            {
              questionId: 1,
              answers: [{ answerId: 1, value: 2 }],
            },
          ],
        },
      ],
    };
    const state = toSurveyState(dto);
    expect(state.selections[0]!.questions[0]!.answers[0]!.isChecked).toBe(true);
  });

  it('有効な value は StarLevel に変換される', () => {
    const dto = {
      userName: 'テストユーザー',
      categories: [
        {
          categoryId: 1,
          questions: [
            {
              questionId: 1,
              answers: [{ answerId: 1, value: 4 }],
            },
          ],
        },
      ],
    };
    const state = toSurveyState(dto);
    expect(state.selections[0]!.questions[0]!.answers[0]!.value).toBe(4);
  });

  it('無効な value（範囲外）は undefined になる', () => {
    const dto = {
      userName: 'テストユーザー',
      categories: [
        {
          categoryId: 1,
          questions: [
            {
              questionId: 1,
              answers: [{ answerId: 1, value: 99 }],
            },
          ],
        },
      ],
    };
    const state = toSurveyState(dto);
    expect(state.selections[0]!.questions[0]!.answers[0]!.value).toBeUndefined();
  });

  it('toSheetDto → toSurveyState で構造が保たれる', () => {
    const dto = toSheetDto(mockSurveyState);
    const state = toSurveyState(dto);
    expect(state.userName).toBe('テストユーザー');
    expect(state.selections[0]!.categoryId).toBe(1);
    expect(state.selections[0]!.questions[0]!.answers[0]!.value).toBe(3);
  });
});
