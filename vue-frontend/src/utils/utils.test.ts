import { describe, it, expect } from 'vitest';
import { initQuestionStates } from './utils';
import type { Question } from '@/types';

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
});
