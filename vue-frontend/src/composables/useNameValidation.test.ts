import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useNameValidation } from './useNameValidation';

describe('useNameValidation', () => {
  it('名前が入力されているとき validate は true を返す', () => {
    const userName = ref('山田太郎');
    const { validate, validationErrors } = useNameValidation(userName);
    const result = validate();
    expect(result).toBe(true);
    expect(validationErrors.value).toHaveLength(0);
  });

  it('送信後に名前を入力するとエラーがリアルタイムで消える', () => {
    const userName = ref('');
    const { validate, validationErrors, onInput } = useNameValidation(userName);

    validate();
    expect(validationErrors.value).toHaveLength(1);
    userName.value = '山田太郎';

    onInput();
    expect(validationErrors.value).toHaveLength(0);
  });

  it('空文字のとき validate は false を返す', () => {
    const userName = ref('');
    const { validate, validationErrors } = useNameValidation(userName);
    const result = validate();
    expect(result).toBe(false);
    expect(validationErrors.value).toHaveLength(1);
  });

  it('スペースのみの入力はエラーになる', () => {
    const userName = ref(' ');
    const { validate, validationErrors } = useNameValidation(userName);

    validate();
    expect(validationErrors.value).toHaveLength(1);
  });
});
