import { createMemoryHistory, createRouter } from 'vue-router';
import SurveyPage from './SurveyPage.vue';
import type { Category, QuestionState } from '@/types/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { ROUTES } from '@/utils/constants.ts';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { useSurveyStore } from '@/stores/useSurveyStore.ts';
import { nextTick } from 'vue';

const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/survey', component: SurveyPage },
      { path: '/result', component: { template: '<div />' } },
    ],
  });

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  genre: '共通の質問',
  icon: 'fa-solid fa-briefcase',
  isChecked: true,
  questions: [],
  ...overrides,
});

describe('SurveyPage', () => {
  let router: ReturnType<typeof buildRouter>;

  beforeEach(async () => {
    router = buildRouter();
    await router.push(ROUTES.SURVEY);
  });

  const categoryWithUncheckedAnswer = makeCategory({
    questions: [
      { id: 1, questionText: 'Q1. テスト', answers: [{ label: '回答A', isChecked: false }] },
    ],
  });

  const createWrapper = (surveyState: Record<string, unknown> = {}) =>
    mount(SurveyPage, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            stubActions: false,
            initialState: {
              survey: {
                userName: 'テストユーザー',
                categoryData: [categoryWithUncheckedAnswer],
                ...surveyState,
              },
            },
          }),
        ],
        stubs: {
          'font-awesome-icon': true,
          QuestionCard: {
            name: 'QuestionCard',
            props: ['question'],
            emits: ['update:question'],
            template: '<div class="question-card-stub" />',
          },
        },
      },
    });

  // ─── 表示 ────────────────────────────────────────────────────

  it('store のユーザー名が表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.user-greeting').text()).toContain('テストユーザー');
  });

  it('isChecked = true のカテゴリセクションが表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.category-section').exists()).toBe(true);
  });

  it('isChecked = false のカテゴリセクションは表示されない', () => {
    const wrapper = createWrapper({
      categoryData: [makeCategory({ isChecked: false })],
    });
    expect(wrapper.findAll('.category-section')).toHaveLength(0);
  });

  it('複数カテゴリが選択されている場合、両セクションが表示される', () => {
    const wrapper = createWrapper({
      categoryData: [
        makeCategory({ id: 1, isChecked: true }),
        makeCategory({ id: 2, icon: 'fa-solid fa-computer', isChecked: true }),
      ],
    });
    expect(wrapper.findAll('.category-section')).toHaveLength(2);
  });

  it('カテゴリ名が表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.category-title').text()).toBe('共通の質問');
  });

  it('質問の数だけ QuestionCard が表示される', () => {
    const wrapper = createWrapper({
      categoryData: [
        makeCategory({
          questions: [
            { id: 1, questionText: 'Q1', answers: [] },
            { id: 2, questionText: 'Q2', answers: [] },
          ],
        }),
      ],
    });
    expect(wrapper.findAll('.question-card-stub')).toHaveLength(2);
  });

  // ─── handleQuestionUpdate ──────────────────────────────────

  it('QuestionCard から update:question を受け取ると store の categoryData が更新される', async () => {
    const wrapper = createWrapper({
      categoryData: [
        makeCategory({
          questions: [
            { id: 1, questionText: 'Q1', answers: [{ label: '回答A', isChecked: false }] },
          ],
        }),
      ],
    });
    const store = useSurveyStore();
    const updatedQuestion: QuestionState = {
      id: 1,
      questionText: 'Q1',
      answers: [{ label: '回答A', isChecked: true, value: 4 }],
    };

    wrapper.findComponent({ name: 'QuestionCard' }).vm.$emit('update:question', updatedQuestion);
    await nextTick();

    expect(store.categoryData[0]!.questions[0]!.answers[0]!.isChecked).toBe(true);
    expect(store.categoryData[0]!.questions[0]!.answers[0]!.value).toBe(4);
  });

  // ─── バリデーション ───────────────────────────────────────────────

  it('チェックなし回答のみの場合はエラーなしで遷移できる', async () => {
    const wrapper = createWrapper({ categoryData: [categoryWithUncheckedAnswer] });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(ROUTES.RESULT);
  });

  it('チェックあり・習熟度未選択の場合はエラーが表示される', async () => {
    const categoryWithUnchosenLevel = makeCategory({
      questions: [
        { id: 1, questionText: 'Q1. テスト', answers: [{ label: '回答A', isChecked: true }] },
      ],
    });
    const wrapper = createWrapper({ categoryData: [categoryWithUnchosenLevel] });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY);
  });

  it('エラー発生時に送信ボタンが無効化される', async () => {
    const categoryWithUnchosenLevel = makeCategory({
      questions: [
        { id: 1, questionText: 'Q1. テスト', answers: [{ label: '回答A', isChecked: true }] },
      ],
    });
    const wrapper = createWrapper({ categoryData: [categoryWithUnchosenLevel] });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect((wrapper.find('.submit-button').element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.find('.submit-button').classes()).toContain('disabled');
  });

  it('isSubmitDisabled が true のときヒントテキストが表示される', async () => {
    const categoryWithUnchosenLevel = makeCategory({
      questions: [
        { id: 1, questionText: 'Q1. テスト', answers: [{ label: '回答A', isChecked: true }] },
      ],
    });
    const wrapper = createWrapper({ categoryData: [categoryWithUnchosenLevel] });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.submit-hint').exists()).toBe(true);
  });

  it('チェックあり・習熟度選択済みの場合はエラーなしで遷移できる', async () => {
    const categoryWithChosenLevel = makeCategory({
      questions: [
        {
          id: 1,
          questionText: 'Q1. テスト',
          answers: [{ label: '回答A', isChecked: true, value: 3 as const }],
        },
      ],
    });
    const wrapper = createWrapper({ categoryData: [categoryWithChosenLevel] });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(ROUTES.RESULT);
  });

  it('エラー修正後は送信ボタンが再び有効になる', async () => {
    const categoryWithUnchosenLevel = makeCategory({
      questions: [
        { id: 1, questionText: 'Q1. テスト', answers: [{ label: '回答A', isChecked: true }] },
      ],
    });
    const wrapper = createWrapper({ categoryData: [categoryWithUnchosenLevel] });
    const store = useSurveyStore();

    // まずエラー状態にする
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect((wrapper.find('.submit-button').element as HTMLButtonElement).disabled).toBe(true);

    // ストアを直接更新して習熟度を選択済みにする
    store.categoryData[0]!.questions[0]!.answers[0]!.value = 3;
    await nextTick();

    expect((wrapper.find('.submit-button').element as HTMLButtonElement).disabled).toBe(false);
  });
});
