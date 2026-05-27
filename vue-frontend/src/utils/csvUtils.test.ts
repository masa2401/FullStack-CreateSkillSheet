import type { SurveyData } from '@/types';
import { convertToCSV } from './csvUtils';
import { describe, it, expect } from 'vitest';

const mockData: SurveyData = {
  userName: 'テストユーザー',
  categories: [
    {
      id: 1,
      genre: '共通の質問',
      isChecked: true,
      questions: [
        {
          id: 1,
          questionText: 'Q1. テスト質問',
          answers: [
            { label: 'チェック済み回答', isChecked: true, value: 3 },
            { label: '未チェック回答', isChecked: false },
          ],
        },
      ],
    },
  ],
};

describe('convertToCSV', () => {
  const csv = convertToCSV(mockData);
  it('BOM付きUTF-8で始まる', () => {
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('チェックされていない回答は出力されない', () => {
    expect(csv).not.toContain('未チェック回答');
  });

  it('ユーザー名が含まれる', () => {
    expect(csv).toContain('テストユーザー');
  });

  it('ダブルクォートを含む値はエスケープされる', () => {
    const dataWithQuote = {
      ...mockData,
      userName: '山田"太郎',
    };
    expect(convertToCSV(dataWithQuote)).toContain('山田""太郎'); //エスケープされて""になっていればOK
  });
});
