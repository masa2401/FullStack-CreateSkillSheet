import type { Component } from 'vue'

import { Briefcase, FolderOpen, Monitor, Palette } from '@lucide/vue'

/**
 * カテゴリ key と表示アイコンの対応表。
 *
 * 質問マスタを純粋なデータ（JSON化可能な状態）に保つため、
 * アイコンはデータ層に持たせず表示層で解決する。
 * 将来バックエンドからカテゴリを追加する構成になっても、
 * データ側は key を返すだけで済む。
 */
const CATEGORY_ICONS: Record<string, Component> = {
  common: Briefcase,
  engineer: Monitor,
  designer: Palette,
}

/** 対応表にない key は既定アイコンにフォールバックする */
export const resolveCategoryIcon = (key: string): Component => CATEGORY_ICONS[key] ?? FolderOpen
