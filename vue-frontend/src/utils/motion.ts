/**
 * OS のモーション低減設定に応じたスクロール挙動を返す。
 *
 * `src/assets/index.css` 末尾のグローバルブロックは CSS の transition と
 * animation しか止められず、JS で明示的に渡す `behavior: 'smooth'` には効かない。
 * そのため scrollTo / scrollIntoView の呼び出し側でこの関数を経由する。
 *
 * 呼び出しのたびに評価するので、OS 設定の変更にそのまま追従する。
 * jsdom は `window.matchMedia` を実装していないため typeof で保護する。
 */
export const getScrollBehavior = (): ScrollBehavior =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
