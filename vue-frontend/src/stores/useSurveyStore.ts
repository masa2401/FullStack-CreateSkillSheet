import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

import { CATEGORY_MASTERS } from '@/data/questions'
import type { AnswerSelection, CategorySelection, QuestionSelection, SurveyState } from '@/types'
import { checkSheetExists, saveSheet } from '@/utils/api'

export const useSurveyStore = defineStore(
  'survey',
  () => {
    // ─── State ─────────────────────────────────────────────────────

    const userName = ref<string>('')
    const selections = ref<CategorySelection[]>(buildInitialSelections())

    const savedSheetId = ref<string | null>(null)
    const savedDataSnapshot = ref<string>('')
    const isIdVerified = ref<boolean>(false)

    // ─── 初期状態の構築 ────────────────────────────────────────────

    function buildQuestionsForCategory(categoryId: number): QuestionSelection[] {
      const master = CATEGORY_MASTERS.find((m) => m.id === categoryId)!
      return master.questions.map((q): QuestionSelection => ({
        questionId: q.id,
        answers: q.answers.map((a): AnswerSelection => ({
          answerId: a.id,
          isChecked: false,
          value: undefined,
        })),
      }))
    }

    function buildInitialSelections(): CategorySelection[] {
      return CATEGORY_MASTERS.map((master): CategorySelection => ({
        categoryId: master.id,
        isChecked: master.isCheckedByDefault,
        questions: buildQuestionsForCategory(master.id),
      }))
    }

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

    const loadFromSharedState = (state: SurveyState) => {
      userName.value = state.userName
      selections.value = buildInitialSelections()

      state.selections.forEach((incoming) => {
        const sel = selections.value.find((s) => s.categoryId === incoming.categoryId)
        if (!sel) return
        sel.isChecked = incoming.isChecked

        incoming.questions.forEach((incomingQ) => {
          const qSel = sel.questions.find((q) => q.questionId === incomingQ.questionId)
          if (!qSel) return

          incomingQ.answers.forEach((incomingA) => {
            const aSel = qSel.answers.find((a) => a.answerId === incomingA.answerId)
            if (!aSel) return
            aSel.isChecked = incomingA.isChecked
            aSel.value = incomingA.value
          })
        })
      })
    }

    const getSavedIdOrSave = async (): Promise<string> => {
      const currentSnapshot = JSON.stringify(surveyState.value)

      if (savedSheetId.value && savedDataSnapshot.value === currentSnapshot) {
        if (isIdVerified.value) {
          return savedSheetId.value
        }
        const exists = await checkSheetExists(savedSheetId.value)
        if (exists) {
          isIdVerified.value = true
          return savedSheetId.value
        }
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

    const reset = (): void => {
      userName.value = ''
      selections.value = buildInitialSelections()
      savedSheetId.value = null
      savedDataSnapshot.value = ''
      isIdVerified.value = false
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
      loadFromSharedState,
      getSavedIdOrSave,
      reset,
    }
  },
  {
    persist: {
      pick: ['userName', 'selections', 'savedSheetId', 'savedDataSnapshot'],
    },
  },
)
