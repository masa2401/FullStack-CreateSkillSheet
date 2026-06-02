import { watch, computed } from 'vue';
import type { Ref } from 'vue';
import type { CategoryState, AnswerState, ValidationError, QuestionState } from '@/types';
import { useValidation } from '@/composables/useValidation';

// ─── composable ────────────────────────────────────────────────────────────────

export function useSurveyValidation(categoryData: Ref<CategoryState[]>) {
  /**
   * 各回答に対するバリデーションルールを評価し、エラーがあれば ValidationError オブジェクトを返す。
   * ルール：チェックされている回答で、かつ値が空の場合はエラー。
   */
  const checkAnswerError = (
    category: CategoryState,
    question: QuestionState,
    answer: AnswerState,
  ): ValidationError | null => {
    if (answer.isChecked && !answer.value) {
      return {
        category: category.genre,
        text: question.questionText,
      };
    }
    return null;
  };

  /**
   * 全カテゴリの全質問の全回答に対して checkAnswerError を適用し、エラーがあれば配列で返す。
   */
  const buildErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    categoryData.value.forEach((category) => {
      if (!category.isChecked) return;
      category.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          const error = checkAnswerError(category, question, answer);
          if (error) errors.push(error);
        });
      });
    });
    return errors;
  };

  const { validationErrors, hasAttemptedSubmit, validate } = useValidation(buildErrors);

  const isSubmitDisabled = computed(
    () => hasAttemptedSubmit.value && validationErrors.value.length > 0,
  );

  watch(
    categoryData,
    () => {
      if (hasAttemptedSubmit.value) {
        validationErrors.value = buildErrors();
      }
    },
    { deep: true },
  );

  return {
    validationErrors,
    hasAttemptedSubmit,
    validate,
    isSubmitDisabled,
  };
}
