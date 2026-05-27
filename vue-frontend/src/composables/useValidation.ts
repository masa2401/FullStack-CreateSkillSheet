import { ref } from 'vue';
import type { ValidationError } from '@/types';

/**
 * バリデーションロジックを共通化するためのカスタムフック。バリデーションエラーの状態管理と、送信試行の有無を追跡する。
 * @param buildErrors - バリデーションエラーを生成する関数。呼び出されると、現在の入力状態に基づいてエラーの配列を返す必要がある。
 * @returns validationErrors - 現在のバリデーションエラーの配列。
 * @returns hasAttemptedSubmit - 送信が試みられたかどうかを示すフラグ。
 * @returns validate - バリデーションを実行する関数。呼び出されると、hasAttemptedSubmit を true に設定し、validationErrors を更新する。
 */

export function useValidation(buildErrors: () => ValidationError[]) {
  const validationErrors = ref<ValidationError[]>([]);
  const hasAttemptedSubmit = ref<boolean>(false);
  const validate = (): boolean => {
    hasAttemptedSubmit.value = true;
    validationErrors.value = buildErrors();
    return validationErrors.value.length === 0;
  };
  return {
    validationErrors,
    hasAttemptedSubmit,
    validate,
  };
}
