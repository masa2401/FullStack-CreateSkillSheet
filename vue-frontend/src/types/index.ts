export * from './question';
import type { QuestionState } from './question';

export interface SurveyData {
  userName: string;
  categories: CategoryState[];
}

/** マスターデータ: カテゴリの定義情報のみ */
export interface CategoryDef {
  id: number;
  genre: string;
  icon: string;
}

/** UI状態: 選択状態・質問状態を含む */
export interface CategoryState {
  id: number;
  genre: string;
  icon: string;
  isChecked: boolean;
  questions: QuestionState[];
}

export interface ValidationError {
  category: string;
  text: string;
  answer?: string;
}
