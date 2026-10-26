export const LEVEL_LABELS = [
  { stars: '★☆☆☆☆', text: '習得が不十分な状態' },
  { stars: '★★☆☆☆', text: '基礎はあるが不安定' },
  { stars: '★★★☆☆', text: '期待どおりにできる' },
  { stars: '★★★★☆', text: '期待以上の成果を出す' },
  { stars: '★★★★★', text: '卓越したレベルで発揮する' },
]

export const ROUTES = {
  TOP: '/',
  SURVEY: '/survey',
  RESULT: '/result',
}

/**
 * 表計算ソフトが数式として解釈する先頭文字。
 * CSV 出力時のエスケープと、お名前入力のバリデーションで共用する。
 * タブ・復帰はセルの結合に悪用されるため含める
 * （入力欄側は trim 後に判定するため、そちらでは発火しない）。
 */
export const FORMULA_PREFIX = /^[=+\-@\t\r]/
