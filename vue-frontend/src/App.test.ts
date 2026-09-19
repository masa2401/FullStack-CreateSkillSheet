import { createMemoryHistory, createRouter } from 'vue-router'

import { createTestingPinia } from '@pinia/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CategorySelection, SurveyState } from '@/types/state'
import * as apiUtils from '@/utils/api'
import { ROUTES } from '@/utils/constants'
import { encodeData } from '@/utils/shareUtils'
import ResultPage from '@/views/ResultPage.vue'

import App from './App.vue'

/**
 * ページ単体のテストでは `<router-view>` と `<transition mode="out-in">` を通らないため、
 * 「URL は変わったが次のページが描画されない」「同じページのままクエリだけ変わっても表示が変わらない」
 * といった不具合を検出できない。ここでは App.vue を描画し、遷移後に実際に表示される内容を確かめる。
 */
const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: ROUTES.TOP, component: { template: '<p>トップページ</p>' } },
      { path: ROUTES.SURVEY, component: { template: '<p>アンケートページ</p>' } },
      { path: ROUTES.RESULT, component: ResultPage },
    ],
  })

const mockSelections: CategorySelection[] = [
  {
    categoryId: 1,
    isChecked: true,
    questions: [{ questionId: 1, answers: [{ answerId: 1, isChecked: true, value: 3 }] }],
  },
]

const sharedState: SurveyState = { userName: '共有ユーザー', selections: mockSelections }

describe('App（ページ遷移）', () => {
  let router: ReturnType<typeof buildRouter>

  beforeEach(async () => {
    router = buildRouter()
    await router.push(ROUTES.RESULT)
  })

  const renderApp = () =>
    render(App, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            initialState: { survey: { userName: '自分', selections: mockSelections } },
          }),
        ],
        stubs: {
          // 既定ではスタブに置き換わり、out-in の待ち合わせが起きなくなるため本物を使う
          transition: false,
          TheHeader: true,
          TheFooter: true,
          'font-awesome-icon': true,
          ShareButton: { template: '<div data-testid="share-button" />' },
          AnimatedIconButton: {
            props: ['icon', 'label', 'animationType', 'variant'],
            emits: ['click'],
            template: `<button @click="$emit('click')">{{ label }}</button>`,
          },
        },
      },
    })

  const findHeading = (name: string) =>
    screen.findByRole('heading', { name: `${name} 様のスキルシート` })

  it('結果ページで「修正する」を押すと、アンケートページが描画される', async () => {
    const user = userEvent.setup()
    renderApp()
    await findHeading('自分')

    await user.click(screen.getByRole('button', { name: '修正する' }))

    expect(await screen.findByText('アンケートページ')).toBeInTheDocument()
  })

  it('エラー画面で「トップへ戻る」を押すと、トップページが描画される', async () => {
    await router.push({ path: ROUTES.RESULT, query: { id: 'shared-id' } })
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue({ status: 'notfound' })
    const user = userEvent.setup()
    renderApp()

    await user.click(await screen.findByRole('button', { name: 'トップへ戻る' }))

    expect(await screen.findByText('トップページ')).toBeInTheDocument()
  })

  it('自分の結果ページから共有リンクへクエリだけ変わる遷移をすると、共有シートに切り替わる', async () => {
    renderApp()
    await findHeading('自分')

    await router.push({ path: ROUTES.RESULT, query: { data: encodeData(sharedState)! } })

    expect(await findHeading('共有ユーザー')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '自分のスキルシートを作成' })).toBeInTheDocument()
  })

  it('共有シートから自分の結果ページへクエリだけ変わる遷移をすると、自分のシートに切り替わる', async () => {
    await router.push({ path: ROUTES.RESULT, query: { data: encodeData(sharedState)! } })
    renderApp()
    await findHeading('共有ユーザー')

    await router.push(ROUTES.RESULT)

    expect(await findHeading('自分')).toBeInTheDocument()
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })
})
