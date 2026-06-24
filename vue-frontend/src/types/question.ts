export type QuestionCategory = 'common' | 'engineer' | 'designer';

export interface CategoryMeta {
  label: string;
  description: string;
}

export type StarLevel = 1 | 2 | 3 | 4 | 5;

// ── マスターデータ型（既存・変更なし）──

export type AnswerDef = {
  id: number;
  label: string;
};

export type Question = {
  id: number;
  questionText: string;
  answers: AnswerDef[];
};

// ── 状態型（新規）──

/**
 * 1つの回答選択肢に対するUI状態。
 * answerIndex で AnswerDef と紐づける。
 */
export type AnswerSelection = {
  answerId: number;
  isChecked: boolean;
  value?: StarLevel;
};

/**
 * 1つの質問に対するUI状態。
 * questionId で Question と紐づける。
 */
export type QuestionSelection = {
  questionId: number;
  answers: AnswerSelection[];
};

/**
 * 1つのカテゴリに対するUI状態。
 * categoryId で CategoryDef と紐づける。
 */
export type CategorySelection = {
  categoryId: number;
  isChecked: boolean;
  questions: QuestionSelection[];
};
