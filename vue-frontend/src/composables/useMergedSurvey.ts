import { CATEGORY_MASTER_BY_ID } from '@/data/questions';
import { useSurveyStore } from '@/stores/useSurveyStore';
import type { MergedCategory } from '@/types';
import { computed } from 'vue';

export function useMergedSurvey() {
  const store = useSurveyStore();

  const mergedCategories = computed<MergedCategory[]>(() =>
    store.selections.map((sel) => {
      const master = CATEGORY_MASTER_BY_ID.get(sel.categoryId)!;
      return {
        id: master.id,
        label: master.label,
        icon: master.icon,
        isChecked: sel.isChecked,
        questions: sel.questions.map((qSel) => {
          const questionDef = master.questions.find((q) => q.id === qSel.questionId)!;
          return {
            id: questionDef.id,
            questionText: questionDef.questionText,
            answers: qSel.answers.map((aSel) => {
              const answerDef = questionDef.answers.find((a) => a.id === aSel.answerId)!;
              return {
                id: aSel.answerId,
                label: answerDef.label,
                isChecked: aSel.isChecked,
                value: aSel.value,
              };
            }),
          };
        }),
      };
    }),
  );
  return { mergedCategories };
}
