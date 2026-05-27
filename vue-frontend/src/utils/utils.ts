import type { Question, QuestionState } from '@/types';

// ========================================
// データ変換
// ========================================

/**
 * 質問データをQuestionState形式に変換するユーティリティ関数
 * @param {Question} question - 変換対象の質問データ
 * @returns {QuestionState} 変換された質問状態オブジェクト
 */

const toQuestionState = (question: Question): QuestionState => ({
  ...question,
  answers: question.answers.map((label) => ({ label })),
});

export const initQuestionStates = (questions: Question[]) => questions.map(toQuestionState); // Question[] → QuestionState[]

/** 質問状態オブジェクトから質問データを抽出するユーティリティ関数
 * @param {QuestionState[]} questions - 抽出対象の質問状態オブジェクトの配列
 * @returns {Question[]} 抽出された質問データの配列
 */

export const extractQuestionData = (questions: QuestionState[]): QuestionState[] =>
  questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    answers: q.answers.map((a) => ({
      label: a.label,
      isChecked: a.isChecked,
      value: a.value,
    })),
  }));
