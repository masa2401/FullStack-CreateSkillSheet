import { QUESTION_DATA } from '@/data/questions';
import { useSurveyStore } from '@/stores/useSurveyStore';
import { CATEGORIES } from '@/utils/constants';
import { computed } from 'vue';

/**
 * マスターデータと状態を結合した表示用ビュー。
 * コンポーネントはこれを参照する。
 */

export function useResolvedSurvey() {
  const store = useSurveyStore();
  const resolvedCategories = computed(() =>
    store.selections.map((sel) => {
      const categoryDef = Object.values(CATEGORIES).find((c) => c.id === sel.categoryId)!;
      const questionMaster =
        categoryDef.id === CATEGORIES.COMMON.id
          ? QUESTION_DATA.common
          : categoryDef.id === CATEGORIES.ENGINEER.id
            ? QUESTION_DATA.engineer
            : QUESTION_DATA.designer;
      return {
        id: categoryDef.id,
        genre: categoryDef.genre,
        icon: categoryDef.icon,
        isChecked: sel.isChecked,
        questions: sel.questions.map((qSel) => {
          const questionDef = questionMaster.find((q) => q.id === qSel.questionId)!;
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
  return { resolvedCategories };
}
