import { QUESTION_DATA } from '@/data/questions';
import type { CategoryState, QuestionState, SurveyData } from '@/types';
import { CATEGORIES } from '@/utils/constants';
import { initQuestionStates } from '@/utils/utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSurveyStore = defineStore(
  'survey',
  () => {
    // ─── State ─────────────────────────────────────────────────────
    const userName = ref<string>('');

    const categoryData = ref<CategoryState[]>([
      {
        ...CATEGORIES.COMMON,
        isChecked: true,
        questions: initQuestionStates(QUESTION_DATA.common),
      },
      {
        ...CATEGORIES.ENGINEER,
        isChecked: false,
        questions: initQuestionStates(QUESTION_DATA.engineer),
      },
      {
        ...CATEGORIES.DESIGNER,
        isChecked: false,
        questions: initQuestionStates(QUESTION_DATA.designer),
      },
    ]);

    // ─── Getters ───────────────────────────────────────────────────
    /** 送信・共有用にシリアライズされたデータ */
    const surveyData = computed<SurveyData>(() => ({
      userName: userName.value,
      categories: categoryData.value,
    }));

    const isEngineerSelected = computed(
      () => categoryData.value.find((c) => c.id === CATEGORIES.ENGINEER.id)?.isChecked ?? false,
    );

    const isDesignerSelected = computed(
      () => categoryData.value.find((c) => c.id === CATEGORIES.DESIGNER.id)?.isChecked ?? false,
    );

    // ─── Actions ───────────────────────────────────────────────────
    const setUserName = (name: string): void => {
      userName.value = name;
    };

    const setCategoryChecked = (categoryId: number, checked: boolean): void => {
      const target = categoryData.value.find((c) => c.id === categoryId);
      if (target) target.isChecked = checked;
    };

    const updateQuestion = (
      categoryIndex: number,
      questionIndex: number,
      updatedQuestion: QuestionState,
    ): void => {
      categoryData.value[categoryIndex]!.questions[questionIndex] = updatedQuestion;
    };

    const loadFromSharedData = (data: SurveyData): void => {
      userName.value = data.userName;
      categoryData.value = categoryData.value.map((cat) => {
        const shared = data.categories.find((c) => c.id === cat.id);
        return shared ? { ...cat, isChecked: shared.isChecked, questions: shared.questions } : cat;
      });

      try {
        localStorage.setItem(
          'survey',
          JSON.stringify({ userName: userName.value, categoryData: categoryData.value }),
        );
      } catch (e) {
        console.error('Failed to update localStorage manually:', e);
      }
    };

    const reset = (): void => {
      userName.value = '';
      categoryData.value = categoryData.value.map((cat) => ({
        ...cat,
        isChecked: cat.id === CATEGORIES.COMMON.id,
        questions: initQuestionStates(
          cat.id === CATEGORIES.COMMON.id
            ? QUESTION_DATA.common
            : cat.id === CATEGORIES.ENGINEER.id
              ? QUESTION_DATA.engineer
              : QUESTION_DATA.designer,
        ),
      }));
    };

    return {
      userName,
      categoryData,
      surveyData,
      isEngineerSelected,
      isDesignerSelected,
      setUserName,
      setCategoryChecked,
      updateQuestion,
      loadFromSharedData,
      reset,
    };
  },
  { persist: true },
);
