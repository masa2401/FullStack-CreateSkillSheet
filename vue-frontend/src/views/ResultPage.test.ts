import type { CategorySelection, SurveyState } from '@/types/state.ts'
import * as apiUtils from '@/utils/api.ts'
import { ROUTES } from '@/utils/constants'
import * as shareUtils from '@/utils/shareUtils.ts'
import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ResultPage from './ResultPage.vue'

const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: ROUTES.RESULT, component: ResultPage },
      { path: ROUTES.SURVEY, component: { template: '<div />' } },
      { path: ROUTES.TOP, component: { template: '<div />' } },
    ],
  })

const mockSelections: CategorySelection[] = [
  {
    categoryId: 1,
    isChecked: true,
    questions: [
      {
        questionId: 1,
        answers: [
          { answerId: 1, isChecked: true, value: 3 },
          { answerId: 2, isChecked: false },
        ],
      },
    ],
  },
  { categoryId: 2, isChecked: false, questions: [] },
  { categoryId: 3, isChecked: false, questions: [] },
]

const urlSurveyState: SurveyState = {
  userName: 'URLユーザー',
  selections: mockSelections,
}

describe('ResultPage', () => {
  let router: ReturnType<typeof buildRouter>

  beforeEach(async () => {
    router = buildRouter()
    await router.push(ROUTES.RESULT)
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(null)
  })

  const createWrapper = (surveyState: Record<string, unknown> = {}) =>
    mount(ResultPage, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            initialState: {
              survey: {
                userName: 'テストユーザー',
                selections: mockSelections,
                ...surveyState,
              },
            },
          }),
        ],
        stubs: {
          'font-awesome-icon': true,
          ShareButton: {
            name: 'ShareButton',
            template: '<div class="share-button-stub" />',
          },
          AnimatedIconButton: {
            name: 'AnimatedIconButton',
            template: '<button @click="$emit(\'click\')">{{ label }}</button>',
            props: ['icon', 'label', 'animationType'],
            emits: ['click'],
          },
        },
      },
    })

  // ─── データ取得 ─────────────────────────────────────────────────

  it('store のデータからユーザー名が表示される', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.page-title').text()).toContain('テストユーザー')
  })

  it('URL データがある場合は URL データが優先して表示される', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.page-title').text()).toContain('URLユーザー')
  })

  it('id パラメータがありバックエンド有効な場合、fetchSheet の結果を反映する', async () => {
    vi.spyOn(shareUtils, 'getIdFromUrl').mockReturnValue('shared-id')
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue({ status: 'success', data: urlSurveyState })

    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.page-title').text()).toContain('URLユーザー')
  })

  // ─── 表示内容 ──────────────────────────────────────────────────

  it('isChecked = true のカテゴリのみ表示される', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.findAll('.category-section')).toHaveLength(1)
  })

  it('isChecked = false のカテゴリは表示されない', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const titles = wrapper.findAll('.category-title').map((el) => el.text())
    expect(titles).not.toContain('エンジニア向けの質問')
  })

  it('チェックされた回答のみスキルカードに表示される', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const skillNames = wrapper.findAll('.skill-name').map((el) => el.text())
    expect(skillNames).toHaveLength(1)
    expect(skillNames[0]).toBeTruthy()
  })

  it('習熟度の星が正しく表示される（レベル3 = ★★★☆☆）', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.level-stars').text()).toBe('★★★☆☆')
  })

  it('通常ビューでは ShareButton が表示される', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.share-button-stub').exists()).toBe(true)
  })

  it('共有ビューでは ShareButton が表示されない', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.share-button-stub').exists()).toBe(false)
  })

  it('共有ビューでは「自分のスキルシートを作成」ボタンが表示される', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    const wrapper = createWrapper()
    await flushPromises()
    const button = wrapper.findComponent({ name: 'AnimatedIconButton' })
    expect(button.props('label')).toContain('自分のスキルシートを作成')
  })

  it('fetchSheet が expired を返す場合はエラー画面になる', async () => {
    vi.spyOn(shareUtils, 'getIdFromUrl').mockReturnValue('shared-id')
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue({ status: 'expired' })

    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.find('.error-title').text()).toContain('有効期限')
  })

  // ─── ナビゲーション ────────────────────────────────────────────

  it('修正するボタンをクリックすると SurveyPage へ遷移する', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.findAllComponents({ name: 'AnimatedIconButton' })[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY)
  })

  it('印刷するボタンをクリックすると window.print が呼ばれる', async () => {
    window.print = () => {}
    const printMock = vi.spyOn(window, 'print')
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.findAllComponents({ name: 'AnimatedIconButton' })[1]!.trigger('click')
    expect(printMock).toHaveBeenCalledOnce()
  })

  it('トップへ戻るボタンをクリックすると TopPage へ遷移する', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const buttons = wrapper.findAllComponents({ name: 'AnimatedIconButton' })
    await buttons[buttons.length - 1]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })
})
