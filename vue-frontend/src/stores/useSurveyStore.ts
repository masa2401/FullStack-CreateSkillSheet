import { QUESTION_DATA } from '@/data/questions';
import type { CategoryState, QuestionState, SurveyData } from '@/types';
import { checkSheetExists, saveSheet } from '@/utils/api';
import { CATEGORIES } from '@/utils/constants';
import { initQuestionStates } from '@/utils/utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSurveyStore = defineStore('survey', () => {
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

  const savedSheetId = ref<string | null>(null);
  const savedDataSnapshot = ref<string>(''); // 保存時点のデータをJSON文字列で保持

  // persist対象外にする（ページリロードで意図的にリセット）
  const isIdVerified = ref<boolean>(false);

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

  const getSavedIdOrSave = async (): Promise<string> => {
    const currentSnapshot = JSON.stringify(surveyData.value);

    // すでに保存済み かつ データが変わっていない → IDを使い回す
    if (savedSheetId.value && savedDataSnapshot.value === currentSnapshot) {
      // 検証済みならAPI通信なしでIDをそのまま返す
      if (isIdVerified.value) {
        return savedSheetId.value;
      }

      // 未検証（ページロード後初回）のみDBに問い合わせる
      const exists = await checkSheetExists(savedSheetId.value);
      if (exists) {
        isIdVerified.value = true; // 以降のクリックはここをスキップ
        return savedSheetId.value; // DBにも存在 → そのまま使う
      }

      // DBに存在しない → リセット
      savedSheetId.value = null;
      savedDataSnapshot.value = '';
    }

    // 未保存 or データが変わった → 新規保存
    const id = await saveSheet(surveyData.value);
    if (!id) throw new Error('保存に失敗しました'); // 追加
    savedSheetId.value = id;
    savedDataSnapshot.value = currentSnapshot;
    isIdVerified.value = true; // 新規保存直後は検証済み扱い
    return id;
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

  const $persist = {
    paths: ['userName', 'categoryData', 'savedSheetId', 'savedDataSnapshot'],
  };

  return {
    userName,
    categoryData,
    surveyData,
    isEngineerSelected,
    isDesignerSelected,
    savedSheetId,
    savedDataSnapshot,
    setUserName,
    setCategoryChecked,
    updateQuestion,
    loadFromSharedData,
    getSavedIdOrSave,
    reset,
    $persist,
  };
});
