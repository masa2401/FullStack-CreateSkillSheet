import { describe, it, expect } from 'vitest';
import { extractQuestionData, initQuestionStates } from './utils';
import type { Question } from '@/types';

// ─── データ変換 ───────────────────────────────────────────────────────────────

describe('initQuestionStates', () => {
  const questions: Question[] = [
    { id: 1, questionText: 'Q1. テスト質問', answers: ['回答A', '回答B'] },
  ];

  it('answers の文字列を label を持つオブジェクトに変換する', () => {
    const [result] = initQuestionStates(questions);
    expect(result!.answers).toEqual([{ label: '回答A' }, { label: '回答B' }]);
  });

  it('id と questionText は維持される', () => {
    const [result] = initQuestionStates(questions);
    expect(result!.id).toBe(1);
    expect(result!.questionText).toBe('Q1. テスト質問');
  });

  it('空配列を渡すと空配列が返る', () => {
    expect(initQuestionStates([])).toEqual([]);
  });
});

describe('extractQuestionData', () => {
  it('label, isChecked, value のみを抽出する', () => {
    const questions = [
      {
        id: 1,
        questionText: 'Q1. テスト質問',
        answers: [{ label: '回答A', isChecked: true, value: 3 as const }],
      },
    ];
    const [result] = extractQuestionData(questions);
    expect(result!.answers[0]).toEqual({ label: '回答A', isChecked: true, value: 3 });
  });

  it('id と questionText は維持される', () => {
    const questions = [{ id: 1, questionText: 'Q1. テスト質問', answers: [] }];
    const [result] = extractQuestionData(questions);
    expect(result!.id).toBe(1);
    expect(result!.questionText).toBe('Q1. テスト質問');
  });
});
