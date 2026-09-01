import { createMemoryHistory, createRouter } from 'vue-router'

import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EditableNameHeading from '@/components/EditableNameHeading.vue'
import { useSurveyStore } from '@/stores/useSurveyStore.ts'
import type { CategorySelection, SurveyState } from '@/types/state.ts'
import * as apiUtils from '@/utils/api.ts'
import { ROUTES } from '@/utils/constants'
import * as shareUtils from '@/utils/shareUtils.ts'

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
    expect(wrapper.find('[data-slot="user-name-heading"]').text()).toContain('テストユーザー')
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

  it('データ読み込み中はローディング表示になる', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
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

  it('習熟度未設定の回答は星が空表示になる', async () => {
    const wrapper = createWrapper({
      selections: [
        {
          categoryId: 1,
          isChecked: true,
          questions: [
            { questionId: 1, answers: [{ answerId: 1, isChecked: true, value: undefined }] },
          ],
        },
        { categoryId: 2, isChecked: false, questions: [] },
        { categoryId: 3, isChecked: false, questions: [] },
      ],
    })
    await flushPromises()
    expect(wrapper.find('.level-stars').text()).toBe('')
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

  it.each([
    [{ status: 'expired', expiryDays: 5 } as const, '有効期限', '有効期限（5日間）が切れています'],
    [{ status: 'notfound' } as const, 'リンクが見つかりません', '削除された可能性があります'],
    [{ status: 'error' } as const, '読み込みに失敗しました', '時間をおいて再度お試しください'],
  ])(
    'fetchSheet が %o を返す場合は該当するエラー画面になる',
    async (result, titleText, messageText) => {
      vi.spyOn(shareUtils, 'getIdFromUrl').mockReturnValue('shared-id')
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
      vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue(result)

      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.find('.error-title').text()).toContain(titleText)
      expect(wrapper.find('.error-message').text()).toContain(messageText)
    },
  )

  // ─── ナビゲーション ────────────────────────────────────────────

  it('修正するボタンをクリックすると SurveyPage へ遷移する', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.findAllComponents({ name: 'AnimatedIconButton' })[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY)
  })

  it('トップへ戻るボタンをクリックすると TopPage へ遷移する', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const buttons = wrapper.findAllComponents({ name: 'AnimatedIconButton' })
    await buttons[buttons.length - 1]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })

  it('エラー画面のトップへ戻るボタンをクリックすると TopPage へ遷移する', async () => {
    vi.spyOn(shareUtils, 'getIdFromUrl').mockReturnValue('shared-id')
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue({ status: 'notfound' })

    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })

  it('共有ビューで「自分のスキルシートを作成」をクリックすると store がリセットされてから TopPage へ遷移する', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    const wrapper = createWrapper()
    await flushPromises()
    const store = useSurveyStore()

    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click')
    await flushPromises()

    expect(store.userName).toBe('')
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })

  it('名前を確定すると setUserName が呼ばれ、バックエンド無効時は保存されない', async () => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
    const wrapper = createWrapper()
    await flushPromises()
    const store = useSurveyStore()
    const saveSpy = vi.spyOn(store, 'getSavedIdOrSave')

    wrapper.findComponent(EditableNameHeading).vm.$emit('commit', '山田太郎')
    await flushPromises()

    expect(store.userName).toBe('山田太郎')
    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('名前を確定するとバックエンド有効時は保存される', async () => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'saveSheet').mockResolvedValue('new-id')
    const wrapper = createWrapper()
    await flushPromises()

    wrapper.findComponent(EditableNameHeading).vm.$emit('commit', '山田太郎')
    await flushPromises()

    expect(apiUtils.saveSheet).toHaveBeenCalledOnce()
  })

  it('保存に失敗してもエラーが外に伝播しない', async () => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'saveSheet').mockRejectedValue(new Error('failed'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = createWrapper()
    await flushPromises()

    wrapper.findComponent(EditableNameHeading).vm.$emit('commit', '山田太郎')
    await flushPromises()

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})
