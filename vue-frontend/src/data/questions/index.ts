import type { Question, QuestionCategory, CategoryMeta } from '@/types/question';
import { commonQuestions } from '@/data/questions/common';
import { engineerQuestions } from '@/data/questions/engineer';
import { designerQuestions } from '@/data/questions/designer';

export const CATEGORY_META: Record<QuestionCategory, CategoryMeta> = {
  common: { label: '共通', description: '全ユーザーが回答する項目' },
  engineer: {
    label: 'プログラマ / ITエンジニア',
    description: '開発言語、フレームワーク、インフラ関連のスキル',
  },
  designer: {
    label: 'デザイナー / 動画制作',
    description: 'デザインツール、動画編集、制作スキル',
  },
};

export const QUESTION_DATA: Record<QuestionCategory, Question[]> = {
  common: commonQuestions,
  engineer: engineerQuestions,
  designer: designerQuestions,
};
