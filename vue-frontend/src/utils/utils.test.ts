import type { Question } from '@/types';
import { describe, expect, it } from 'vitest';
import { initQuestionStates } from './utils';

// ─── データ変換 ───────────────────────────────────────────────────────────────

describe('initQuestionStates', () => {
  const questions: Question[] = [
    { id: 1, questionText: 'Q1. テスト質問', answers: [{ label: '回答A' }, { label: '回答B' }] },
  ];

  it('answers に isChecked: false が付与される', () => {
    const [result] = initQuestionStates(questions);
    expect(result!.answers[0]!.isChecked).toBe(false);
    expect(result!.answers[1]!.isChecked).toBe(false);
  });

  it('label はマスターデータから引き継がれる', () => {
    const [result] = initQuestionStates(questions);
    expect(result!.answers[0]!.label).toBe('回答A');
  });

  it('id と questionText は維持される', () => {
    const [result] = initQuestionStates(questions);
    expect(result!.id).toBe(1);
    expect(result!.questionText).toBe('Q1. テスト質問');
  });

  it('空配列を渡すと空配列が返る', () => {
    expect(initQuestionStates([])).toEqual([]);
  });

  it('value が undefined の answer にも isChecked: false が付与される', () => {
    const questions: Question[] = [{ id: 2, questionText: 'Q2', answers: [{ label: '選択肢' }] }];
    const [result] = initQuestionStates(questions);
    expect(result!.answers[0]!.isChecked).toBe(false);
    // マスターデータに value がなくても壊れないこと
    expect(result!.answers[0]!.value).toBeUndefined();
  });

  it('answer の isChecked がマスターデータ側に存在しても false で上書きされる', () => {
    // AnswerDef に isChecked が混入していた場合でも初期化できること
    const dirtyAnswer: Record<string, unknown> = {
      label: '回答',
      isChecked: true,
    };
    const questions = [
      {
        id: 3,
        questionText: 'Q3',
        answers: [dirtyAnswer],
      },
    ] as unknown as Question[];
    const [result] = initQuestionStates(questions);
    expect(result!.answers[0]!.isChecked).toBe(false);
  });
});
