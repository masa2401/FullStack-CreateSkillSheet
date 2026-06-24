import AnswerItem from '@/components/AnswerItem.vue';
import { useValidation } from '@/composables/useValidation';
import type { ValidationError } from '@/types';
import type { ComputedRef } from 'vue';
import { computed, watch } from 'vue';

type ResolvedCategory = {
  id: number;
  isChecked: boolean;
  genre: string;
  questions: {
    id: number;
    questionText: string;
    answers: {
      id: number;
      label: string;
      isChecked: boolean;
      value?: number;
    }[];
  }[];
};

// ─── composable ────────────────────────────────────────────────────────────────

export function useSurveyValidation(resolvedCategories: ComputedRef<ResolvedCategory[]>) {
  const buildErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    resolvedCategories.value.forEach((cat) => {
      if (!cat.isChecked) return;
      cat.questions.forEach((q) => {
        q.answers.forEach((a) => {
          if (a.isChecked && !AnswerItem.value) {
            errors.push({ category: cat.genre, text: q.questionText });
          }
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
    resolvedCategories,
    () => {
      if (hasAttemptedSubmit.value) {
        validationErrors.value = buildErrors();
      }
    },
    { deep: true },
  );

  return { validationErrors, hasAttemptedSubmit, validate, isSubmitDisabled };
}
