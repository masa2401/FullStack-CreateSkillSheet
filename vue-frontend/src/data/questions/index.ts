import { commonQuestions } from '@/data/questions/common';
import { designerQuestions } from '@/data/questions/designer';
import { engineerQuestions } from '@/data/questions/engineer';
import type { CategoryMaster } from '@/types';

export const CATEGORY_MASTERS: CategoryMaster[] = [
  {
    id: 1,
    key: 'common',
    icon: 'fa-solid fa-briefcase',
    label: '共通',
    description: '全ユーザーが回答する項目',
    isCheckedByDefault: true,
    questions: commonQuestions,
  },
  {
    id: 2,
    key: 'engineer',
    icon: 'fa-solid fa-computer',
    label: 'プログラマ / ITエンジニア',
    description: '開発言語、フレームワーク、インフラ関連のスキル',
    isCheckedByDefault: false,
    questions: engineerQuestions,
  },
  {
    id: 3,
    key: 'designer',
    icon: 'fa-solid fa-palette',
    label: 'デザイナー / 動画制作',
    description: 'デザインツール、動画編集、制作スキル',
    isCheckedByDefault: false,
    questions: designerQuestions,
  },
];

export const CATEGORY_MASTER_BY_ID: Map<number, CategoryMaster> = new Map(
  CATEGORY_MASTERS.map((c) => [c.id, c]),
);
