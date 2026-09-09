import { createMemoryHistory, createRouter } from 'vue-router'

import { createTestingPinia } from '@pinia/testing'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore.ts'
import { ROUTES } from '@/utils/constants.ts'

import TopPage from './TopPage.vue'

const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: TopPage },
      { path: '/survey', component: { template: '<div />' } },
    ],
  })

/**
 * `createTestingPinia` の `initialState` は値を参照のまま取り込む。
 * 使い回すとテスト内の更新が配列の中身に残り、次のテストへ持ち越される。
 * 呼び出しごとに作り直すこと。
 */
const buildSelections = () => [
  { categoryId: 1, isChecked: true, questions: [] },
  { categoryId: 2, isChecked: false, questions: [] },
  { categoryId: 3, isChecked: false, questions: [] },
]

const engineerCheckbox = () => screen.getByRole('checkbox', { name: 'プログラマ / ITエンジニア' })

const designerCheckbox = () => screen.getByRole('checkbox', { name: 'デザイナー / 動画制作' })

describe('TopPage', () => {
  let router: ReturnType<typeof buildRouter>

  beforeEach(async () => {
    router = buildRouter()
    await router.push(ROUTES.TOP)
  })

  const renderTopPage = (surveyState: Record<string, unknown> = {}) =>
    render(TopPage, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            initialState: {
              survey: {
                userName: '',
                selections: buildSelections(),
                ...surveyState,
              },
            },
          }),
        ],
        stubs: { 'font-awesome-icon': true },
      },
    })

  // ─── カテゴリ選択 ────────────────────────────────────────────────

  it('エンジニアカードにチェックを入れると選択状態になる', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(engineerCheckbox())

    expect(engineerCheckbox()).toBeChecked()
  })

  it('デザイナーカードにチェックを入れると選択状態になる', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(designerCheckbox())

    expect(designerCheckbox()).toBeChecked()
  })

  it('エンジニアカードをチェックすると store の selections が更新される', async () => {
    const user = userEvent.setup()
    renderTopPage()
    const store = useSurveyStore()

    await user.click(engineerCheckbox())

    expect(store.selections.find((s) => s.categoryId === 2)?.isChecked).toBe(true)
  })

  it('両カードを同時に選択できる', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(engineerCheckbox())
    await user.click(designerCheckbox())

    expect(engineerCheckbox()).toBeChecked()
    expect(designerCheckbox()).toBeChecked()
  })

  it('チェック済みカードのチェックを外すと選択状態が解除される', async () => {
    const user = userEvent.setup()
    const engineerCheckedSelections = buildSelections().map((s) =>
      s.categoryId === 2 ? { ...s, isChecked: true } : s,
    )
    renderTopPage({ selections: engineerCheckedSelections })

    await user.click(engineerCheckbox())

    expect(engineerCheckbox()).not.toBeChecked()
  })

  // ─── ページ遷移 ────────────────────────────────────────────────

  it('「アンケートを開始」ボタンをクリックすると /survey へ遷移する', async () => {
    const user = userEvent.setup()
    renderTopPage()

    await user.click(screen.getByRole('button', { name: 'アンケートを開始' }))

    await waitFor(() => expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY))
  })
})
