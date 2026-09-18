import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

import type { AnswerSelection, CategorySelection, SurveyState } from '@/types'
import { fetchSheet, saveSheet } from '@/utils/api'
import { buildInitialSelections, buildQuestionsForCategory } from '@/utils/surveyState'

export const useSurveyStore = defineStore(
  'survey',
  () => {
    // ─── State ─────────────────────────────────────────────────────

    const userName = ref<string>('')
    const selections = ref<CategorySelection[]>(buildInitialSelections())

    const savedSheetId = ref<string | null>(null)
    const savedDataSnapshot = ref<string>('')
    const isIdVerified = ref<boolean>(false)

    // ─── Getters ───────────────────────────────────────────────────

    const surveyState = computed<SurveyState>(() => ({
      userName: userName.value,
      selections: selections.value,
    }))

    const hasAnswers = computed<boolean>(() =>
      selections.value
        .filter((cat) => cat.isChecked)
        .some((cat) => cat.questions.some((q) => q.answers.some((a) => a.isChecked))),
    )

    // ─── Actions ───────────────────────────────────────────────────

    const setUserName = (name: string): void => {
      userName.value = name
    }

    const setCategoryChecked = (categoryId: number, checked: boolean): void => {
      const sel = selections.value.find((s) => s.categoryId === categoryId)
      if (!sel) return
      sel.isChecked = checked
      if (!checked) {
        sel.questions = buildQuestionsForCategory(categoryId)
      }
    }

    const setAnswerSelection = (
      categoryId: number,
      questionId: number,
      answerId: number,
      patch: Partial<Pick<AnswerSelection, 'isChecked' | 'value'>>,
    ): void => {
      const aSel = selections.value
        .find((s) => s.categoryId === categoryId)
        ?.questions.find((q) => q.questionId === questionId)
        ?.answers.find((a) => a.answerId === answerId)
      if (aSel) Object.assign(aSel, patch)
    }

    const getSavedIdOrSave = async (): Promise<string> => {
      const currentSnapshot = JSON.stringify(surveyState.value)

      if (savedSheetId.value && savedDataSnapshot.value === currentSnapshot) {
        if (isIdVerified.value) {
          return savedSheetId.value
        }
        const result = await fetchSheet(savedSheetId.value)
        if (result.status === 'success') {
          isIdVerified.value = true
          return savedSheetId.value
        }
        // 通信エラーや5xxは、シートが無いのではなく確認できなかっただけなので、作り直さずに既存IDを使う。
        // 検証済みにはしないため、次の呼び出しであらためて確認する
        if (result.status === 'error') {
          return savedSheetId.value
        }
        // 期限切れ（410）・未存在（404）の場合だけ、保存し直す
        savedSheetId.value = null
        savedDataSnapshot.value = ''
      }

      const id = await saveSheet(surveyState.value)
      if (!id) throw new Error('保存に失敗しました')
      savedSheetId.value = id
      savedDataSnapshot.value = currentSnapshot
      isIdVerified.value = true
      return id
    }

    return {
      userName,
      selections,
      surveyState,
      hasAnswers,
      savedSheetId,
      savedDataSnapshot,
      setUserName,
      setCategoryChecked,
      setAnswerSelection,
      getSavedIdOrSave,
    }
  },
  {
    persist: {
      pick: ['userName', 'selections', 'savedSheetId', 'savedDataSnapshot'],
    },
  },
)
