import { useSurveyStore } from '@/stores/useSurveyStore.ts';
import { ROUTES } from '@/utils/constants.ts';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import SurveyPage from './SurveyPage.vue';

const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/survey', component: SurveyPage },
      { path: '/result', component: { template: '<div />' } },
    ],
  });

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
];

describe('SurveyPage', () => {
  let router: ReturnType<typeof buildRouter>;

  beforeEach(async () => {
    router = buildRouter();
    await router.push(ROUTES.SURVEY);
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
                selections: makeSelections(),
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
            emits: ['update:answer'],
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
      selections: [{ categoryId: 1, isChecked: false, questions: [] }],
    });
    expect(wrapper.findAll('.category-section')).toHaveLength(0);
  });

  it('複数カテゴリが選択されている場合、両セクションが表示される', () => {
    const wrapper = createWrapper({
      selections: [
        { categoryId: 1, isChecked: true, questions: [] },
        { categoryId: 2, isChecked: true, questions: [] },
        { categoryId: 3, isChecked: false, questions: [] },
      ],
    });
    expect(wrapper.findAll('.category-section')).toHaveLength(2);
  });

  it('カテゴリ名が表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.category-title').text()).toBe('共通');
  });

  // ─── バリデーション ───────────────────────────────────────────────

  it('チェックなし回答のみの場合はエラーなしで遷移できる', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(ROUTES.RESULT);
  });

  it('チェックあり・習熟度未選択の場合はエラーが表示される', async () => {
    const wrapper = createWrapper({
      selections: makeSelections({ isChecked: true }),
    });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY);
  });

  it('エラー発生時に送信ボタンが無効化される', async () => {
    const wrapper = createWrapper({
      selections: makeSelections({ isChecked: true }),
    });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect((wrapper.find('.submit-button').element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.find('.submit-button').classes()).toContain('disabled');
  });

  it('isSubmitDisabled が true のときヒントテキストが表示される', async () => {
    const wrapper = createWrapper({
      selections: makeSelections({ isChecked: true }),
    });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.submit-hint').exists()).toBe(true);
  });

  it('チェックあり・習熟度選択済みの場合はエラーなしで遷移できる', async () => {
    const wrapper = createWrapper({
      selections: makeSelections({ isChecked: true, value: 3 }),
    });
    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(ROUTES.RESULT);
  });

  it('エラー修正後は送信ボタンが再び有効になる', async () => {
    const wrapper = createWrapper({
      selections: makeSelections({ isChecked: true }),
    });
    const store = useSurveyStore();

    await wrapper.find('.submit-button').trigger('click');
    await flushPromises();
    expect((wrapper.find('.submit-button').element as HTMLButtonElement).disabled).toBe(true);

    store.setAnswerSelection(1, 1, 1, { value: 3 });
    await nextTick();

    expect((wrapper.find('.submit-button').element as HTMLButtonElement).disabled).toBe(false);
  });
});
