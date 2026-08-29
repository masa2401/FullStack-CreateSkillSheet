import { createMemoryHistory, createRouter } from 'vue-router'

import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
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

const initialSelections = [
  { categoryId: 1, isChecked: true, questions: [] },
  { categoryId: 2, isChecked: false, questions: [] },
  { categoryId: 3, isChecked: false, questions: [] },
]

describe('TopPage', () => {
  let router: ReturnType<typeof buildRouter>

  beforeEach(async () => {
    router = buildRouter()
    await router.push(ROUTES.TOP)
  })

  const createWrapper = (surveyState: Record<string, unknown> = {}) =>
    mount(TopPage, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            initialState: {
              survey: {
                userName: '',
                selections: initialSelections,
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
    const wrapper = createWrapper()
    const [enginnerCheckbox] = wrapper.findAll('input[type="checkbox"]')
    await enginnerCheckbox!.setValue(true)
    expect((enginnerCheckbox!.element as HTMLInputElement).checked).toBe(true)
  })

  it('デザイナーカードにチェックを入れると選択状態になる', async () => {
    const wrapper = createWrapper()
    const checkbox = wrapper.findAll('input[type="checkbox"]')[1]!
    await checkbox.setValue(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('エンジニアカードをチェックすると store の selections が更新される', async () => {
    const wrapper = createWrapper()
    const store = useSurveyStore()
    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true)
    expect(store.selections.find((s) => s.categoryId === 2)?.isChecked).toBe(true)
  })

  it('両カードを同時に選択できる', async () => {
    const wrapper = createWrapper()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0]!.setValue(true)
    await checkboxes[1]!.setValue(true)
    expect((checkboxes[0]!.element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1]!.element as HTMLInputElement).checked).toBe(true)
  })

  it('チェック済みカードのチェックを外すと選択状態が解除される', async () => {
    const engineerCheckedSelections = initialSelections.map((s) =>
      s.categoryId === 2 ? { ...s, isChecked: true } : s,
    )
    const wrapper = createWrapper({ selections: engineerCheckedSelections })
    const checkbox = wrapper.findAll('input[type="checkbox"]')[0]!
    await checkbox.setValue(false)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
  })

  // ─── ページ遷移 ────────────────────────────────────────────────

  it('「アンケートを開始」ボタンをクリックすると /survey へ遷移する', async () => {
    const wrapper = createWrapper()
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY)
  })
})
