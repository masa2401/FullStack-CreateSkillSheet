import type { CategorySelection } from './question';

export * from './question';

/** マスターデータ: カテゴリの定義情報のみ */
export interface CategoryDef {
  id: number;
  genre: string;
  icon: string;
}

/**
 * ユーザーの入力状態のみを保持するオブジェクト。
 * マスターデータ（genre, icon, label 等）は含まない。
 * 表示時は categoryId / questionId / answerIndex でマスターと結合する。
 */
export interface SurveyState {
  userName: string;
  selections: CategorySelection[];
}

export interface ValidationError {
  category: string;
  text: string;
  answer?: string;
}
