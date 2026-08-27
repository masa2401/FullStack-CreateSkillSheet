import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CATEGORY_MASTERS } from '@/data/questions'
import * as apiUtils from '@/utils/api'

import { useSurveyStore } from './useSurveyStore'

vi.mock('@/utils/api')

describe('useSurveyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ─── 初期状態 ──────────────────────────────────────────────

  describe('初期状態', () => {
    it('userName が空文字で初期化される', () => {
      const store = useSurveyStore()
      expect(store.userName).toBe('')
    })

    it('マスターデータの数だけ selections が作られる', () => {
      const store = useSurveyStore()
      expect(store.selections).toHaveLength(CATEGORY_MASTERS.length)
    })

    it('isCheckedByDefault: true のカテゴリのみ isChecked: true になる', () => {
      const store = useSurveyStore()
      const checked = store.selections.filter((s) => s.isChecked)
      expect(checked).toHaveLength(1)
      expect(checked[0]!.categoryId).toBe(1)
    })
  })

  // ─── setUserName ──────────────────────────────────────────

  describe('setUserName', () => {
    it('userName が更新される', () => {
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      expect(store.userName).toBe('山田太郎')
    })
  })

  // ─── setCategoryChecked ────────────────────────────────────

  describe('setCategoryChecked', () => {
    it('存在するカテゴリの isChecked が更新される', () => {
      const store = useSurveyStore()
      store.setCategoryChecked(2, true)
      expect(store.selections.find((s) => s.categoryId === 2)?.isChecked).toBe(true)
    })

    it('存在しないカテゴリIDを指定しても何も起きない', () => {
      const store = useSurveyStore()
      const before = JSON.stringify(store.selections)
      store.setCategoryChecked(999, true)
      expect(JSON.stringify(store.selections)).toBe(before)
    })

    it('チェックを外すと、そのカテゴリの回答（isChecked/value）がリセットされる', () => {
      const store = useSurveyStore()
      store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 4 })

      store.setCategoryChecked(1, false)

      const answer = store.selections
        .find((s) => s.categoryId === 1)!
        .questions.find((q) => q.questionId === 1)!
        .answers.find((a) => a.answerId === 1)!
      expect(answer.isChecked).toBe(false)
      expect(answer.value).toBeUndefined()
    })

    it('あるカテゴリのチェックを外しても、他カテゴリの回答は影響を受けない', () => {
      const store = useSurveyStore()
      store.setCategoryChecked(2, true)
      store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 5 })

      store.setCategoryChecked(2, false)

      const answer = store.selections
        .find((s) => s.categoryId === 1)!
        .questions.find((q) => q.questionId === 1)!
        .answers.find((a) => a.answerId === 1)!
      expect(answer.isChecked).toBe(true)
      expect(answer.value).toBe(5)
    })
  })

  // ─── hasAnswers ────────────────────────────────────────────

  describe('hasAnswers', () => {
    it('初期状態では false', () => {
      const store = useSurveyStore()
      expect(store.hasAnswers).toBe(false)
    })

    it('isChecked なカテゴリに回答があれば true', () => {
      const store = useSurveyStore()
      store.setAnswerSelection(1, 1, 1, { isChecked: true })
      expect(store.hasAnswers).toBe(true)
    })

    it('（不整合データ対策）isChecked: false のカテゴリに isChecked な回答が残っていても false', () => {
      const store = useSurveyStore()
      const target = store.selections.find((s) => s.categoryId === 2)!
      target.isChecked = false
      target.questions.forEach((q) => {
        q.answers.forEach((a) => {
          a.isChecked = true
        })
      })

      expect(store.hasAnswers).toBe(false)
    })

    it('loadFromSharedState 経由で isChecked: false のカテゴリに回答が入っていても無視される', () => {
      const store = useSurveyStore()
      store.loadFromSharedState({
        userName: '山田太郎',
        selections: [
          {
            categoryId: 1,
            isChecked: false,
            questions: [{ questionId: 1, answers: [{ answerId: 1, isChecked: true, value: 3 }] }],
          },
        ],
      })

      expect(store.hasAnswers).toBe(false)
    })
  })

  // ─── setAnswerSelection ────────────────────────────────────

  describe('setAnswerSelection', () => {
    it('存在する回答の isChecked / value が更新される', () => {
      const store = useSurveyStore()
      store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 3 })
      const answer = store.selections
        .find((s) => s.categoryId === 1)!
        .questions.find((q) => q.questionId === 1)!
        .answers.find((a) => a.answerId === 1)!
      expect(answer.isChecked).toBe(true)
      expect(answer.value).toBe(3)
    })

    it('存在しない answerId を指定しても何も起きない', () => {
      const store = useSurveyStore()
      const before = JSON.stringify(store.selections)
      store.setAnswerSelection(1, 1, 999, { isChecked: true })
      expect(JSON.stringify(store.selections)).toBe(before)
    })

    it('存在しない categoryId / questionId を指定しても何も起きない', () => {
      const store = useSurveyStore()
      const before = JSON.stringify(store.selections)
      store.setAnswerSelection(999, 999, 1, { isChecked: true })
      expect(JSON.stringify(store.selections)).toBe(before)
    })
  })

  // ─── loadFromSharedState ───────────────────────────────────

  describe('loadFromSharedState', () => {
    it('userName が復元される', () => {
      const store = useSurveyStore()
      store.loadFromSharedState({
        userName: '山田太郎',
        selections: [],
      })
      expect(store.userName).toBe('山田太郎')
    })

    it('受け取った isChecked / value が反映される', () => {
      const store = useSurveyStore()
      store.loadFromSharedState({
        userName: '山田太郎',
        selections: [
          {
            categoryId: 1,
            isChecked: true,
            questions: [
              {
                questionId: 1,
                answers: [{ answerId: 1, isChecked: true, value: 4 }],
              },
            ],
          },
        ],
      })
      const answer = store.selections
        .find((s) => s.categoryId === 1)!
        .questions.find((q) => q.questionId === 1)!
        .answers.find((a) => a.answerId === 1)!
      expect(answer.isChecked).toBe(true)
      expect(answer.value).toBe(4)
    })

    it('マスターデータに存在しない categoryId は無視される', () => {
      const store = useSurveyStore()
      expect(() =>
        store.loadFromSharedState({
          userName: '山田太郎',
          selections: [{ categoryId: 999, isChecked: true, questions: [] }],
        }),
      ).not.toThrow()
    })

    it('呼び出し前の状態は一度リセットされてから上書きされる', () => {
      const store = useSurveyStore()
      store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 5 })

      store.loadFromSharedState({ userName: '山田太郎', selections: [] })

      const answer = store.selections
        .find((s) => s.categoryId === 1)!
        .questions.find((q) => q.questionId === 1)!
        .answers.find((a) => a.answerId === 1)!
      expect(answer.isChecked).toBe(false)
      expect(answer.value).toBeUndefined()
    })

    it('受け取ったデータに存在しない questionId が含まれていても無視される', () => {
      const store = useSurveyStore()
      expect(() =>
        store.loadFromSharedState({
          userName: '山田太郎',
          selections: [
            { categoryId: 1, isChecked: true, questions: [{ questionId: 999, answers: [] }] },
          ],
        }),
      ).not.toThrow()
    })

    it('受け取ったデータに存在しない answerId が含まれていても無視される', () => {
      const store = useSurveyStore()
      expect(() =>
        store.loadFromSharedState({
          userName: '山田太郎',
          selections: [
            {
              categoryId: 1,
              isChecked: true,
              questions: [
                { questionId: 1, answers: [{ answerId: 999, isChecked: true, value: 3 }] },
              ],
            },
          ],
        }),
      ).not.toThrow()
    })
  })

  // ─── getSavedIdOrSave ───────────────────────────────────

  describe('getSavedIdOrSave', () => {
    it('未保存の場合は saveSheet を呼び、新しい ID を返す', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValue('new-id')
      const store = useSurveyStore()

      const id = await store.getSavedIdOrSave()

      expect(id).toBe('new-id')
      expect(apiUtils.saveSheet).toHaveBeenCalledOnce()
      expect(store.savedSheetId).toBe('new-id')
    })

    it('saveSheet が null を返す場合はエラーを throw する', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValue(null)
      const store = useSurveyStore()

      await expect(store.getSavedIdOrSave()).rejects.toThrow('保存に失敗しました')
    })

    it('内容が同じで検証済みの場合は saveSheet を呼ばず既存 ID を返す', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValue('existing-id')
      const store = useSurveyStore()

      await store.getSavedIdOrSave()
      vi.mocked(apiUtils.saveSheet).mockClear()

      const id = await store.getSavedIdOrSave()

      expect(id).toBe('existing-id')
      expect(apiUtils.saveSheet).not.toHaveBeenCalled()
    })

    it('内容が同じだが未検証の場合は checkSheetExists で存在確認する', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValue('existing-id')
      const firstStore = useSurveyStore()
      await firstStore.getSavedIdOrSave()
      const persisted = {
        userName: firstStore.userName,
        selections: firstStore.selections,
        savedSheetId: firstStore.savedSheetId,
        savedDataSnapshot: firstStore.savedDataSnapshot,
      }

      // ページ再読み込みを模す：新しい Pinia インスタンス上に
      // 「永続化されたデータ」だけを $patch で復元する
      // （isIdVerified は state として公開されていないため、$patch でも触れられず、
      //   実際のプラグイン挙動と同様に false のまま残る）
      setActivePinia(createPinia())
      const store = useSurveyStore()
      store.$patch(persisted)

      vi.mocked(apiUtils.checkSheetExists).mockResolvedValue(true)
      vi.mocked(apiUtils.saveSheet).mockClear()

      const id = await store.getSavedIdOrSave()

      expect(apiUtils.checkSheetExists).toHaveBeenCalledWith('existing-id')
      expect(id).toBe('existing-id')
      expect(apiUtils.saveSheet).not.toHaveBeenCalled()
    })

    it('存在確認で false の場合は再度 saveSheet が呼ばれる', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValue('existing-id')
      const firstStore = useSurveyStore()
      await firstStore.getSavedIdOrSave()
      const persisted = {
        userName: firstStore.userName,
        selections: firstStore.selections,
        savedSheetId: firstStore.savedSheetId,
        savedDataSnapshot: firstStore.savedDataSnapshot,
      }

      setActivePinia(createPinia())
      const store = useSurveyStore()
      store.$patch(persisted)

      vi.mocked(apiUtils.checkSheetExists).mockResolvedValue(false)
      vi.mocked(apiUtils.saveSheet).mockClear()
      vi.mocked(apiUtils.saveSheet).mockResolvedValueOnce('re-saved-id')

      const id = await store.getSavedIdOrSave()

      expect(apiUtils.saveSheet).toHaveBeenCalledOnce()
      expect(id).toBe('re-saved-id')
    })

    it('内容が変わっていれば savedSheetId があっても新規保存される', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValueOnce('id-before-change')
      const store = useSurveyStore()
      await store.getSavedIdOrSave()

      store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 5 })
      vi.mocked(apiUtils.saveSheet).mockResolvedValueOnce('id-after-change')

      const id = await store.getSavedIdOrSave()

      expect(apiUtils.saveSheet).toHaveBeenCalledTimes(2)
      expect(id).toBe('id-after-change')
    })
  })

  // ─── reset ────────────────────────────────────────────────

  describe('reset', () => {
    it('userName / selections / savedSheetId 等が初期状態に戻る', async () => {
      vi.mocked(apiUtils.saveSheet).mockResolvedValue('id')
      const store = useSurveyStore()
      store.setUserName('山田太郎')
      store.setAnswerSelection(1, 1, 1, { isChecked: true, value: 3 })
      await store.getSavedIdOrSave()

      store.reset()

      expect(store.userName).toBe('')
      expect(store.savedSheetId).toBeNull()
      const answer = store.selections
        .find((s) => s.categoryId === 1)!
        .questions.find((q) => q.questionId === 1)!
        .answers.find((a) => a.answerId === 1)!
      expect(answer.isChecked).toBe(false)
    })
  })
})
