import type { Ref } from 'vue';
import type { ValidationError } from '@/types';
import { useValidation } from '@/composables/useValidation';

/**
 * ユーザー名のバリデーションロジックを提供するカスタムフック。
 * @param userName - バリデーション対象のユーザー名を保持するRef。
 * @returns バリデーションエラー、送信試行の有無、バリデーション関数、および入力イベントハンドラ。
 */

export function useNameValidation(userName: Ref<string>) {
  const buildErrors = (): ValidationError[] => {
    if (!userName.value.trim()) {
      return [{ category: '入力必須項目', text: 'お名前を入力してください' }];
    }
    return [];
  };

  const { validationErrors, hasAttemptedSubmit, validate } = useValidation(buildErrors);

  /**
   * 入力イベントハンドラ。送信が試みられた後にユーザー名が変更された場合、バリデーションエラーを再評価する。
   */

  const onInput = (): void => {
    if (hasAttemptedSubmit.value) {
      validationErrors.value = buildErrors();
    }
  };
  return {
    validationErrors,
    hasAttemptedSubmit,
    validate,
    onInput,
  };
}
