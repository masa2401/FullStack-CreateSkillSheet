import { useValidation } from '@/composables/useValidation';
import type { MergedCategory, ValidationError } from '@/types';
import type { ComputedRef } from 'vue';
import { computed, watch } from 'vue';

// ─── composable ────────────────────────────────────────────────────────────────

export function useSurveyValidation(mergedCategories: ComputedRef<MergedCategory[]>) {
  const buildErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    mergedCategories.value.forEach((cat) => {
      if (!cat.isChecked) return;
      cat.questions.forEach((q) => {
        q.answers.forEach((a) => {
          if (a.isChecked && !a.value) {
            errors.push({ category: cat.label, text: q.questionText });
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
    () => mergedCategories,
    () => {
      if (hasAttemptedSubmit.value) {
        validationErrors.value = buildErrors();
      }
    },
    { deep: true },
  );

  return { validationErrors, hasAttemptedSubmit, validate, isSubmitDisabled };
}
