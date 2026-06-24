import { QUESTION_DATA } from '@/data/questions';
import type { AnswerSelection, CategorySelection, QuestionSelection, SurveyState } from '@/types';
import { checkSheetExists, saveSheet } from '@/utils/api';
import { CATEGORIES } from '@/utils/constants';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSurveyStore = defineStore('survey', () => {
  // ─── State ─────────────────────────────────────────────────────

  const userName = ref<string>('');
  const selections = ref<CategorySelection[]>(buildInitialSelections());

  const savedSheetId = ref<string | null>(null);
  const savedDataSnapshot = ref<string>('');
  const isIdVerified = ref<boolean>(false);

  // ─── 初期状態の構築 ────────────────────────────────────────────

  function buildInitialSelections(): CategorySelection[] {
    return [
      buildCategorySelection(CATEGORIES.COMMON, QUESTION_DATA.common, true),
      buildCategorySelection(CATEGORIES.ENGINEER, QUESTION_DATA.engineer, false),
      buildCategorySelection(CATEGORIES.DESIGNER, QUESTION_DATA.designer, false),
    ];
  }

  function buildCategorySelection(
    categoryDef: typeof CATEGORIES.COMMON,
    questions: typeof QUESTION_DATA.common,
    isChecked: boolean,
  ): CategorySelection {
    return {
      categoryId: categoryDef.id,
      isChecked,
      questions: questions.map(
        (q): QuestionSelection => ({
          questionId: q.id,
          answers: q.answers.map(
            (a): AnswerSelection => ({
              answerId: a.id,
              isChecked: false,
              value: undefined,
            }),
          ),
        }),
      ),
    };
  }

  // ─── Getters ───────────────────────────────────────────────────

  /** 保存・共有用のシリアライズ対象（状態のみ） */
  const surveyState = computed<SurveyState>(() => ({
    userName: userName.value,
    selections: selections.value,
  }));

  const isEngineerSelected = computed(
    () => selections.value.find((c) => c.categoryId === CATEGORIES.ENGINEER.id)?.isChecked ?? false,
  );

  const isDesignerSelected = computed(
    () => selections.value.find((c) => c.categoryId === CATEGORIES.DESIGNER.id)?.isChecked ?? false,
  );

  // ─── Actions ───────────────────────────────────────────────────
  const setUserName = (name: string): void => {
    userName.value = name;
  };

  const setCategoryChecked = (categoryId: number, checked: boolean): void => {
    const sel = selections.value.find((s) => s.categoryId === categoryId);
    if (sel) sel.isChecked = checked;
  };

  const setAnswerSelection = (categoryId: number,questionId: number,answerId:number,patch: Partial<>)

  /**
   * 共有データ（SurveyState）からストアを復元する。
   * buildInitialSelections() でリセット後、受け取った状態を上書きする。
   * マスターデータに存在しないIDは無視するため、質問追加後の古いURLにも耐えられる。
   */
  const loadFromSharedData = (state: SurveyState): void => {
    userName.value = state.userName;
    selections.value = selections.value.map((sel) => {
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
    const currentSnapshot = JSON.stringify(surveyState.value);

    if (savedSheetId.value && savedDataSnapshot.value === currentSnapshot) {
      if (isIdVerified.value) {
        return savedSheetId.value;
      }
      const exists = await checkSheetExists(savedSheetId.value);
      if (exists) {
        isIdVerified.value = true;
        return savedSheetId.value;
      }
      savedSheetId.value = null;
      savedDataSnapshot.value = '';
    }

    const id = await saveSheet(surveyState.value);
    if (!id) throw new Error('保存に失敗しました');
    savedSheetId.value = id;
    savedDataSnapshot.value = currentSnapshot;
    isIdVerified.value = true;
    return id;
  };

  const reset = (): void => {
    userName.value = '';
    selections.value = buildInitialSelections();
    savedSheetId.value = null;
    savedDataSnapshot.value = '';
    isIdVerified.value = false;
  };

  const $persist = {
    paths: ['userName', 'selections', 'savedSheetId', 'savedDataSnapshot'],
  };

  return {
    userName,
    selections,
    surveyState,
    isEngineerSelected,
    isDesignerSelected,
    savedSheetId,
    savedDataSnapshot,
    setUserName,
    setCategoryChecked,
    loadFromSharedData,
    getSavedIdOrSave,
    reset,
    $persist,
  };
});
