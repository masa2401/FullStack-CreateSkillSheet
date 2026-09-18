import { type MaybeRefOrGetter, computed, toValue } from 'vue'

import { CATEGORY_MASTER_BY_ID } from '@/data/questions'
import { useSurveyStore } from '@/stores/useSurveyStore'
import type { CategorySelection, MergedCategory } from '@/types'

/**
 * 回答（ID と習熟度だけを持つ）をマスタと結合し、表示用のラベルを解決する。
 * 結合する回答は引数で渡す。省略時は作成中のシート（ストア）を使う。
 * 共有リンクで開いたシートはストアに入れないため、`ResultPage` はここで共有データを渡す。
 */
export const useMergedSurvey = (selections?: MaybeRefOrGetter<CategorySelection[]>) => {
  const store = useSurveyStore()
  const source = selections ?? (() => store.selections)

  const mergedCategories = computed<MergedCategory[]>(() =>
    toValue(source).map((sel) => {
      const master = CATEGORY_MASTER_BY_ID.get(sel.categoryId)!
      return {
        id: master.id,
        key: master.key,
        label: master.label,
        isChecked: sel.isChecked,
        questions: sel.questions.map((qSel) => {
          const questionDef = master.questions.find((q) => q.id === qSel.questionId)!
          return {
            id: questionDef.id,
            title: questionDef.title,
            prompt: questionDef.prompt,
            answers: qSel.answers.map((aSel) => {
              const answerDef = questionDef.answers.find((a) => a.id === aSel.answerId)!
              return {
                id: aSel.answerId,
                label: answerDef.label,
                isChecked: aSel.isChecked,
                value: aSel.value,
              }
            }),
          }
        }),
      }
    }),
  )
  return { mergedCategories }
}
