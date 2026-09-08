import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { createTestingPinia } from '@pinia/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'
import { ROUTES } from '@/utils/constants'

import SurveyPage from './SurveyPage.vue'

const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/survey', component: SurveyPage },
      { path: '/result', component: { template: '<div />' } },
    ],
  })

const makeSelections = (
  answerOverrides: { isChecked: boolean; value?: number } = { isChecked: false },
) => [
  {
    categoryId: 1,
    isChecked: true,
    questions: [
      {
        questionId: 1,
        answers: [
          { answerId: 1, ...answerOverrides },
          { answerId: 2, isChecked: false },
          { answerId: 3, isChecked: false },
          { answerId: 4, isChecked: false },
        ],
      },
      {
        questionId: 2,
        answers: [
          { answerId: 1, isChecked: false },
          { answerId: 2, isChecked: false },
          { answerId: 3, isChecked: false },
          { answerId: 4, isChecked: false },
        ],
      },
      {
        questionId: 3,
        answers: [
          { answerId: 1, isChecked: false },
          { answerId: 2, isChecked: false },
          { answerId: 3, isChecked: false },
          { answerId: 4, isChecked: false },
          { answerId: 5, isChecked: false },
        ],
      },
    ],
  },
  { categoryId: 2, isChecked: false, questions: [] },
  { categoryId: 3, isChecked: false, questions: [] },
]

describe('SurveyPage', () => {
  let router: ReturnType<typeof buildRouter>

  beforeEach(async () => {
    router = buildRouter()
    await router.push(ROUTES.SURVEY)
  })

  const renderPage = (surveyState: Record<string, unknown> = {}) =>
    render(SurveyPage, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            initialState: {
              survey: {
                userName: 'テストユーザー',
                selections: makeSelections(),
                ...surveyState,
              },
            },
          }),
        ],
        stubs: {
          'font-awesome-icon': true,
          QuestionSection: {
            props: {
              question: Object,
              questionNumber: Number,
              flaggedAnswerIds: { type: Array, default: () => [] },
            },
            emits: ['update:answer'],
            template: `<button
              :data-flagged="flaggedAnswerIds.join(',')"
              @click="$emit('update:answer', { answerId: 1, patch: { isChecked: true } })"
            >質問{{ question.id }}に回答する</button>`,
          },
        },
      },
    })

  const submitButton = () => screen.getByRole('button', { name: '次へ進む' })

  // ─── 表示 ────────────────────────────────────────────────────

  it('isChecked = true のカテゴリセクションが表示される', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: '共通' })).toBeInTheDocument()
  })

  it('isChecked = false のカテゴリセクションは表示されない', () => {
    renderPage({ selections: [{ categoryId: 1, isChecked: false, questions: [] }] })
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })

  it('複数カテゴリが選択されている場合、両セクションが表示される', () => {
    renderPage({
      selections: [
        { categoryId: 1, isChecked: true, questions: [] },
        { categoryId: 2, isChecked: true, questions: [] },
        { categoryId: 3, isChecked: false, questions: [] },
      ],
    })

    const headings = screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent)
    expect(headings).toEqual(['共通', 'プログラマ / ITエンジニア'])
  })

  it('カテゴリ名が表示される', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('共通')
  })

  // ─── バリデーション ───────────────────────────────────────────────

  it('回答が1件も無い場合は遷移できず、回答無しエラーが表示される', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(submitButton())

    expect(
      await screen.findByText('1つ以上の項目に回答してから次へ進んでください'),
    ).toBeInTheDocument()
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY)
  })

  it('チェックあり・習熟度未選択の場合はエラーが表示される', async () => {
    const user = userEvent.setup()
    renderPage({ selections: makeSelections({ isChecked: true }) })

    await user.click(submitButton())

    expect(
      await screen.findByText('チェックを入れた項目には、習熟度の選択が必須です。'),
    ).toBeInTheDocument()
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY)
  })

  it('エラー発生時に送信ボタンが無効化される', async () => {
    const user = userEvent.setup()
    renderPage({ selections: makeSelections({ isChecked: true }) })

    await user.click(submitButton())

    expect(submitButton()).toHaveAttribute('aria-disabled', 'true')
  })

  it('isSubmitDisabled が true のときヒントテキストが表示される', async () => {
    const user = userEvent.setup()
    const { container } = renderPage({ selections: makeSelections({ isChecked: true }) })

    await user.click(submitButton())

    expect(container.querySelector('[data-slot="submit-hint"]')).toBeInTheDocument()
  })

  it('チェックあり・習熟度選択済みの場合はエラーなしで遷移できる', async () => {
    const user = userEvent.setup()
    renderPage({ selections: makeSelections({ isChecked: true, value: 3 }) })

    await user.click(submitButton())

    expect(router.currentRoute.value.path).toBe(ROUTES.RESULT)
  })

  it('エラー修正後は送信ボタンが再び有効になる', async () => {
    const user = userEvent.setup()
    renderPage({ selections: makeSelections({ isChecked: true }) })
    const store = useSurveyStore()

    await user.click(submitButton())
    expect(submitButton()).toHaveAttribute('aria-disabled', 'true')

    store.setAnswerSelection(1, 1, 1, { value: 3 })
    await nextTick()

    expect(submitButton()).toHaveAttribute('aria-disabled', 'false')
  })

  it('回答無しエラー表示後にチェックを入れると、回答無しエラーが消えて新たなエラーも出ない', async () => {
    const user = userEvent.setup()
    renderPage()
    const store = useSurveyStore()

    await user.click(submitButton())
    expect(
      await screen.findByText('1つ以上の項目に回答してから次へ進んでください'),
    ).toBeInTheDocument()

    store.setAnswerSelection(1, 1, 1, { isChecked: true })
    await nextTick()

    expect(
      screen.queryByText('1つ以上の項目に回答してから次へ進んでください'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('チェックを入れた項目には、習熟度の選択が必須です。'),
    ).not.toBeInTheDocument()
    expect(submitButton()).toHaveAttribute('aria-disabled', 'false')
  })

  it('送信後に新しくチェックを入れてもエラーの件数は増えない', async () => {
    const user = userEvent.setup()
    renderPage({ selections: makeSelections({ isChecked: true }) })
    const store = useSurveyStore()

    await user.click(submitButton())
    expect(await screen.findByText('（1件）')).toBeInTheDocument()

    store.setAnswerSelection(1, 1, 2, { isChecked: true })
    await nextTick()

    expect(screen.getByText('（1件）')).toBeInTheDocument()
  })

  it('送信時に指摘した回答IDが QuestionSection へ渡される', async () => {
    const user = userEvent.setup()
    renderPage({ selections: makeSelections({ isChecked: true }) })

    const firstQuestion = screen.getByRole('button', { name: '質問1に回答する' })
    expect(firstQuestion).toHaveAttribute('data-flagged', '')

    await user.click(submitButton())

    expect(firstQuestion).toHaveAttribute('data-flagged', '1')
    expect(screen.getByRole('button', { name: '質問2に回答する' })).toHaveAttribute(
      'data-flagged',
      '',
    )
  })

  it('QuestionSection から update:answer が発火すると setAnswerSelection が呼ばれる', async () => {
    const user = userEvent.setup()
    renderPage()
    const store = useSurveyStore()
    const spy = vi.spyOn(store, 'setAnswerSelection')

    await user.click(screen.getByRole('button', { name: '質問1に回答する' }))

    expect(spy).toHaveBeenCalledWith(1, 1, 1, { isChecked: true })
  })
})
