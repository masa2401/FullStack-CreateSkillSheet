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
