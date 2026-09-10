/**
 * Vitest のグローバルセットアップ。
 *
 * `@testing-library/jest-dom` の Vitest 版エントリを読み込み、
 * `toBeInTheDocument` などのマッチャを `expect` に登録する。
 *
 * このファイルは `tsconfig.json` の `include` に含める必要がある。
 * 含めないと型の拡張が読まれず、マッチャが TS2339 になる。
 */
import '@testing-library/jest-dom/vitest'

/**
 * jsdom は `Element.prototype.scrollIntoView` を実装していない（happy-dom は実装済み）。
 * `src/views/SurveyPage.vue` の `focusAndScrollTo()` などが呼ぶと
 * 未処理の Promise 拒否になり、テストが全て通っても終了コードが 1 になる。
 *
 * 呼ばれたことを検証したいテストは `vi.spyOn(Element.prototype, 'scrollIntoView')` を使う。
 */
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {}
}
