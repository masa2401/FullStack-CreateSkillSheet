import { commonQuestions } from '@/data/questions/common'
import { designerQuestions } from '@/data/questions/designer'
import { engineerQuestions } from '@/data/questions/engineer'
import type { CategoryMaster } from '@/types'

/**
 * カテゴリ・設問・回答の id は、保存済みのシート（DB）と共有 URL に記録される。
 * 項目を並べ替える・削除する場合も、既存の id を振り直したり別の項目へ使い回したりしない。
 */
export const CATEGORY_MASTERS: CategoryMaster[] = [
  {
    id: 1,
    key: 'common',
    label: '共通スキル',
    description: '全ユーザーが回答する項目',
    isCheckedByDefault: true,
    questions: commonQuestions,
  },
  {
    id: 2,
    key: 'engineer',
    label: 'プログラマ / ITエンジニア',
    description: '開発言語、フレームワーク、インフラ関連のスキル',
    isCheckedByDefault: false,
    questions: engineerQuestions,
  },
  {
    id: 3,
    key: 'designer',
    label: 'デザイナー / 動画制作',
    description: 'デザインツール、動画編集、制作スキル',
    isCheckedByDefault: false,
    questions: designerQuestions,
  },
]

export const CATEGORY_MASTER_BY_ID: Map<number, CategoryMaster> = new Map(
  CATEGORY_MASTERS.map((c) => [c.id, c]),
)
