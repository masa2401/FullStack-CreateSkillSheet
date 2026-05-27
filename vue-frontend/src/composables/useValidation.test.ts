import type { ValidationError } from '@/types';
import { describe, it, expect } from 'vitest';
import { useValidation } from './useValidation';

const noErrors = (): ValidationError[] => [];
const withErrors = (): ValidationError[] => [{ category: 'テスト', text: 'エラー' }];

describe('useValidation', () => {
  it('初期状態ではエラーがない', () => {
    const { validationErrors } = useValidation(noErrors);
    expect(validationErrors.value).toHaveLength(0);
  });

  it('初期状態では hasAttemptedSubmit が false', () => {
    const { hasAttemptedSubmit } = useValidation(noErrors);
    expect(hasAttemptedSubmit.value).toBe(false);
  });

  it('validate を呼ぶと hasAttemptedSubmit が true になる', () => {
    const { validate, hasAttemptedSubmit } = useValidation(noErrors);
    validate();
    expect(hasAttemptedSubmit.value).toBe(true);
  });

  it('エラーがない場合 validate は true を返す', () => {
    const { validate } = useValidation(noErrors);
    expect(validate()).toBe(true);
  });

  it('エラーがある場合 validate は false を返す', () => {
    const { validate } = useValidation(withErrors);
    expect(validate()).toBe(false);
  });

  it('validate 後に validationErrors が更新される', () => {
    const { validate, validationErrors } = useValidation(withErrors);
    validate();
    expect(validationErrors.value).toHaveLength(1);
  });
});
