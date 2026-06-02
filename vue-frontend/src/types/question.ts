export type QuestionCategory = 'common' | 'engineer' | 'designer';
 
export interface CategoryMeta {
  label: string;
  description: string;
}
 
export type StarLevel = 1 | 2 | 3 | 4 | 5;
 
/** マスターデータ: 質問の選択肢ラベルのみ */
export type AnswerDef = {
  label: string;
};
 
/** UI状態: チェック状態・習熟度を含む */
export type AnswerState = {
  label: string;
  isChecked: boolean;
  value?: StarLevel;
};
 
/** マスターデータ: 質問文と選択肢ラベルの定義 */
export type Question = {
  id: number;
  questionText: string;
  answers: AnswerDef[];
};
 
/** UI状態: 質問文と回答状態の組み合わせ */
export type QuestionState = {
  id: number;
  questionText: string;
  answers: AnswerState[];
};
 