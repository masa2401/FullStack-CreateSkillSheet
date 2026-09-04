import { createMemoryHistory, createRouter } from 'vue-router'

import { createTestingPinia } from '@pinia/testing'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'
import type { CategorySelection, SurveyState } from '@/types/state'
import * as apiUtils from '@/utils/api'
import { ROUTES } from '@/utils/constants'
import * as shareUtils from '@/utils/shareUtils'

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
  // isChecked のフィルタを検証するため、未選択カテゴリにもチェック済みの回答を持たせる。
  // 回答が空だと questions.length > 0 のフィルタ側で落ち、isChecked を外しても表示が変わらない。
  {
    categoryId: 2,
    isChecked: false,
    questions: [{ questionId: 1, answers: [{ answerId: 1, isChecked: true, value: 5 }] }],
  },
  { categoryId: 3, isChecked: false, questions: [] },
]

const urlSurveyState: SurveyState = {
  userName: 'URLユーザー',
  selections: mockSelections,
}

/**
 * 名前の確定は `EditableNameHeading` と `useNameCommit` が既に検証している。
 * ここで検証したいのは `handleNameCommitted`（store 更新とバックエンド保存の分岐）だけなので、
 * commit を即座に発火させるスタブへ差し替え、確定までの待ち時間を持ち込まない。
 */
const NAME_COMMIT_STUB = {
  EditableNameHeading: {
    props: ['initialName', 'displayName'],
    emits: ['commit'],
    template: `<button @click="$emit('commit', '山田太郎')">名前を確定する</button>`,
  },
}

describe('ResultPage', () => {
  let router: ReturnType<typeof buildRouter>

  beforeEach(async () => {
    router = buildRouter()
    await router.push(ROUTES.RESULT)
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(null)
  })

  const renderPage = (
    surveyState: Record<string, unknown> = {},
    extraStubs: Record<string, unknown> = {},
  ) =>
    render(ResultPage, {
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
          ShareButton: { template: '<div data-testid="share-button" />' },
          AnimatedIconButton: {
            props: ['icon', 'label', 'animationType', 'variant'],
            emits: ['click'],
            template: `<button @click="$emit('click')">{{ label }}</button>`,
          },
          ...extraStubs,
        },
      },
    })

  /** 読み込み完了（Skeleton が消える）まで待つ */
  const waitForReady = () =>
    waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())

  // ─── データ取得 ─────────────────────────────────────────────────

  it('store のデータからユーザー名が表示される', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'テストユーザー 様のスキルシート' }),
    ).toBeInTheDocument()
  })

  it('URL データがある場合は URL データが優先して表示される', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'URLユーザー 様のスキルシート' }),
    ).toBeInTheDocument()
  })

  it('id パラメータがありバックエンド有効な場合、fetchSheet の結果を反映する', async () => {
    vi.spyOn(shareUtils, 'getIdFromUrl').mockReturnValue('shared-id')
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue({ status: 'success', data: urlSurveyState })

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'URLユーザー 様のスキルシート' }),
    ).toBeInTheDocument()
  })

  it('データ読み込み中はローディング表示になる', () => {
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  // ─── 表示内容 ──────────────────────────────────────────────────

  it('isChecked = true のカテゴリのみ表示される', async () => {
    const { container } = renderPage()
    await waitForReady()

    expect(screen.getByText('共通')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="card-title"]')).toHaveLength(1)
  })

  it('isChecked = false のカテゴリは表示されない', async () => {
    renderPage()
    await waitForReady()

    expect(screen.queryByText('プログラマ / ITエンジニア')).not.toBeInTheDocument()
    expect(screen.queryByText('デザイナー / 動画制作')).not.toBeInTheDocument()
  })

  it('チェックされた回答のみスキルカードに表示される', async () => {
    const { container } = renderPage()
    await waitForReady()

    const skillCards = container.querySelectorAll('[data-slot="skill-card"]')
    expect(skillCards).toHaveLength(1)
    expect(skillCards[0]).toHaveTextContent('Microsoft Word')
  })

  it('習熟度の星が正しく表示される（レベル3 = ★★★☆☆）', async () => {
    const { container } = renderPage()
    await waitForReady()

    expect(container.querySelector('[data-slot="skill-card"]')).toHaveTextContent('★★★☆☆')
  })

  it('習熟度未設定の回答は星が空表示になる', async () => {
    const { container } = renderPage({
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
    await waitForReady()

    expect(container.querySelector('[data-slot="skill-card"]')).not.toHaveTextContent('★')
  })

  it('通常ビューでは ShareButton が表示される', async () => {
    renderPage()
    await waitForReady()

    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })

  it('共有ビューでは ShareButton が表示されない', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    renderPage()
    await waitForReady()

    expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
  })

  it('共有ビューでは「自分のスキルシートを作成」ボタンが表示される', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    renderPage()
    await waitForReady()

    expect(screen.getByRole('button', { name: '自分のスキルシートを作成' })).toBeInTheDocument()
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

      const { container } = renderPage()

      await waitFor(() => {
        expect(container.querySelector('[data-slot="state-panel-title"]')).toHaveTextContent(
          titleText,
        )
      })
      expect(screen.getByText(new RegExp(messageText))).toBeInTheDocument()
    },
  )

  // ─── ナビゲーション ────────────────────────────────────────────

  it('修正するボタンをクリックすると SurveyPage へ遷移する', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: '修正する' }))

    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY)
  })

  it('トップへ戻るボタンをクリックすると TopPage へ遷移する', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitForReady()

    await user.click(screen.getByRole('button', { name: 'トップへ戻る' }))

    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })

  it('エラー画面のトップへ戻るボタンをクリックすると TopPage へ遷移する', async () => {
    vi.spyOn(shareUtils, 'getIdFromUrl').mockReturnValue('shared-id')
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'fetchSheet').mockResolvedValue({ status: 'notfound' })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'トップへ戻る' }))

    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })

  it('共有ビューで「自分のスキルシートを作成」をクリックすると store がリセットされてから TopPage へ遷移する', async () => {
    vi.spyOn(shareUtils, 'getDataFromUrl').mockReturnValue(urlSurveyState)
    const user = userEvent.setup()
    renderPage()
    await waitForReady()
    const store = useSurveyStore()

    await user.click(screen.getByRole('button', { name: '自分のスキルシートを作成' }))

    expect(store.userName).toBe('')
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP)
  })

  // ─── 名前の確定 ────────────────────────────────────────────────

  it('名前を確定すると setUserName が呼ばれ、バックエンド無効時は保存されない', async () => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false)
    const user = userEvent.setup()
    renderPage({}, NAME_COMMIT_STUB)
    await waitForReady()
    const store = useSurveyStore()
    const saveSpy = vi.spyOn(store, 'getSavedIdOrSave')

    await user.click(screen.getByRole('button', { name: '名前を確定する' }))

    expect(store.userName).toBe('山田太郎')
    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('名前を確定するとバックエンド有効時は保存される', async () => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'saveSheet').mockResolvedValue('new-id')
    const user = userEvent.setup()
    renderPage({}, NAME_COMMIT_STUB)
    await waitForReady()

    await user.click(screen.getByRole('button', { name: '名前を確定する' }))

    await waitFor(() => expect(apiUtils.saveSheet).toHaveBeenCalledOnce())
  })

  it('保存に失敗してもエラーが外に伝播しない', async () => {
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true)
    vi.spyOn(apiUtils, 'saveSheet').mockRejectedValue(new Error('failed'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    renderPage({}, NAME_COMMIT_STUB)
    await waitForReady()

    await user.click(screen.getByRole('button', { name: '名前を確定する' }))

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled())
  })
})
