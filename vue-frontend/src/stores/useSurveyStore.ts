import { QUESTION_DATA } from '@/data/questions';
import type { Category, QuestionState, SurveyData } from '@/types';
import { CATEGORIES } from '@/utils/constants';
import { extractQuestionData, initQuestionStates } from '@/utils/utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSurveyStore = defineStore(
  'survey',
  () => {
    // ─── State ─────────────────────────────────────────────────────
    const userName = ref<string>('');

    const categoryData = ref<Category[]>([
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
      categories: categoryData.value.map((cat) => ({
        id: cat.id,
        genre: cat.genre,
        icon: cat.icon,
        isChecked: cat.isChecked,
        questions: extractQuestionData(cat.questions),
      })),
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

    /**
     * 共有URLから読み込んだデータをストアに上書きする。
     * フェーズ2: getDataFromUrl()の代わりに GET /api/surveys/:id を呼ぶ
     */
    const loadFromSharedData = (data: SurveyData): void => {
      userName.value = data.userName;
      // カテゴリデータは現在の質問定義と同期させる
      categoryData.value = categoryData.value.map((cat) => {
        const shared = data.categories.find((c) => c.id === cat.id);
        return shared ? { ...cat, isChecked: shared.isChecked, questions: shared.questions } : cat;
      });
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
  {
    // pinia-plugin-persistedstate の設定
    // キー名やストレージはここで一元管理
    persist: true,
  },
);
