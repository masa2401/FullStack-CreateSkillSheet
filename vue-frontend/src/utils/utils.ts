import type { Question, QuestionState } from '@/types';

// ========================================
// データ変換
// ========================================

/**
 * 質問マスターデータを QuestionState 形式（UI初期状態）に変換する。
 * AnswerDef に isChecked: false を付与して AnswerState を生成する。
 * @param {Question} question - 変換対象の質問マスターデータ
 * @returns {QuestionState} UI初期状態の質問オブジェクト
 */
const toQuestionState = (question: Question): QuestionState => ({
  ...question,
  answers: question.answers.map((a) => ({ isChecked: false, ...a })),
});

export const initQuestionStates = (questions: Question[]): QuestionState[] =>
  questions.map(toQuestionState);
