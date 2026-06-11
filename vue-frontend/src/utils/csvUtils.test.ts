import type { SurveyData } from '@/types';
import { describe, expect, it } from 'vitest';
import { convertToCSV } from './csvUtils';

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
            { label: 'チェック済み回答', isChecked: true, value: 3 as const },
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

  it('isChecked: false のカテゴリは出力されない', () => {
    const dataWithUnchecked: SurveyData = {
      ...mockData,
      categories: [
        ...mockData.categories,
        {
          id: 2,
          genre: '除外カテゴリ',
          isChecked: false,
          questions: [
            {
              id: 2,
              questionText: '除外質問',
              answers: [{ label: '除外回答', isChecked: true, value: 1 as const }],
            },
          ],
        },
      ],
    };
    expect(convertToCSV(dataWithUnchecked)).not.toContain('除外カテゴリ');
  });

  it('同カテゴリの2行目以降はカテゴリ名が空になる（マージ表現）', () => {
    const dataMultiAnswer: SurveyData = {
      userName: 'マルチユーザー',
      categories: [
        {
          id: 1,
          genre: 'カテゴリA',
          isChecked: true,
          questions: [
            {
              id: 1,
              questionText: 'Q1',
              answers: [
                { label: '回答1', isChecked: true, value: 2 as const },
                { label: '回答2', isChecked: true, value: 4 as const },
              ],
            },
          ],
        },
      ],
    };
    const csv = convertToCSV(dataMultiAnswer);
    const lines = csv.split('\r\n');
    // カテゴリ名が含まれる行は1行だけ
    const categoryLines = lines.filter((l) => l.includes('カテゴリA'));
    expect(categoryLines).toHaveLength(1);
  });

  it('全カテゴリが isChecked: false の場合はヘッダーと説明行のみ出力される', () => {
    const emptyData: SurveyData = {
      userName: '空ユーザー',
      categories: [
        {
          id: 1,
          genre: 'テストカテゴリ',
          isChecked: false,
          questions: [],
        },
      ],
    };
    const csv = convertToCSV(emptyData);
    expect(csv).toContain('空ユーザー');
    expect(csv).not.toContain('テストカテゴリ');
  });

  it('改行を含む値はクォートで囲まれ壊れない', () => {
    const dataWithNewline: SurveyData = {
      ...mockData,
      userName: '改行\nユーザー',
    };
    // パース後に行ズレが起きないことをCSV構造で確認
    const csv = convertToCSV(dataWithNewline);
    expect(csv).toContain('"改行\nユーザー"');
  });
});
