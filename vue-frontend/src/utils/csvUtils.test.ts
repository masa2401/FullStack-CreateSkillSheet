import type { CategorySelection } from '@/types';
import { describe, expect, it } from 'vitest';
import { convertToCSV } from './csvUtils';

const mockSelections: CategorySelection[] = [
  {
    categoryId: 1,
    isChecked: true,
    questions: [
      {
        questionId: 1,
        answers: [
          { answerId: 1, isChecked: true, value: 3 },
          { answerId: 2, isChecked: false },
        ],
      },
    ],
  },
];

describe('convertToCSV', () => {
  const csv = convertToCSV('テストユーザー', mockSelections);

  it('ユーザー名が含まれる', () => {
    expect(csv).toContain('テストユーザー');
  });

  it('チェックされていない回答は出力されない', () => {
    const lines = csv.split('\r\n');
    const answerLines = lines.filter((l) => {
      const cols = l.split(',');
      return cols.length === 4 && cols[2] !== '""' && l.includes('★');
    });
    expect(answerLines).toHaveLength(1);
  });

  it('BOMなしの文字列が返る（BOMはdownloadCSV側で付与）', () => {
    expect(csv.startsWith('\uFEFF')).toBe(false);
  });

  it('ダブルクォートを含むユーザー名はエスケープされる', () => {
    const csv = convertToCSV('山田"太郎', mockSelections);
    expect(csv).toContain('山田""太郎');
  });

  it('isChecked: false のカテゴリは出力されない', () => {
    const selectionsWithUnchecked: CategorySelection[] = [
      ...mockSelections,
      {
        categoryId: 2,
        isChecked: false,
        questions: [
          {
            questionId: 1,
            answers: [{ answerId: 1, isChecked: true, value: 1 }],
          },
        ],
      },
    ];
    const csv = convertToCSV('テストユーザー', selectionsWithUnchecked);
    expect(csv).not.toContain('プログラマ / ITエンジニア');
  });

  it('同カテゴリの2行目以降はカテゴリ名が空になる（マージ表現）', () => {
    const selectionsMultiAnswer: CategorySelection[] = [
      {
        categoryId: 1,
        isChecked: true,
        questions: [
          {
            questionId: 1,
            answers: [
              { answerId: 1, isChecked: true, value: 2 },
              { answerId: 2, isChecked: true, value: 4 },
            ],
          },
        ],
      },
    ];
    const csv = convertToCSV('マルチユーザー', selectionsMultiAnswer);
    const lines = csv.split('\r\n');
    const categoryLines = lines.filter((l) => l.includes('共通'));
    expect(categoryLines).toHaveLength(1);
  });

  it('全カテゴリが isChecked: false の場合はユーザー名のみ出力される', () => {
    const emptySelections: CategorySelection[] = [
      {
        categoryId: 1,
        isChecked: false,
        questions: [],
      },
    ];
    const csv = convertToCSV('空ユーザー', emptySelections);
    expect(csv).toContain('空ユーザー');
    expect(csv).not.toContain('共通');
  });

  it('改行を含むユーザー名はクォートで囲まれる', () => {
    const csv = convertToCSV('改行\nユーザー', mockSelections);
    expect(csv).toContain('"改行\nユーザー"');
  });
});
