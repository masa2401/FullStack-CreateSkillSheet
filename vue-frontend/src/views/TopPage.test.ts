import { createMemoryHistory, createRouter } from 'vue-router';
import TopPage from './TopPage.vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { globalStubs } from '@/test/utils.ts';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { CATEGORIES, ROUTES } from '@/utils/constants.ts';
import { useSurveyStore } from '@/stores/useSurveyStore.ts';

const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: TopPage },
      { path: '/survey', component: { template: '<div />' } },
    ],
  });

// ストアの初期カテゴリ状態
const initialCategoryData = [
  {
    id: CATEGORIES.COMMON.id,
    genre: '共通の質問',
    icon: 'fa-solid fa-briefcase',
    isChecked: true,
    questions: [],
  },
  {
    id: CATEGORIES.ENGINEER.id,
    genre: 'エンジニア',
    icon: 'fa-solid fa-computer',
    isChecked: false,
    questions: [],
  },
  {
    id: CATEGORIES.DESIGNER.id,
    genre: 'デザイナー',
    icon: 'fa-solid fa-palette',
    isChecked: false,
    questions: [],
  },
];

describe('TopPage', () => {
  let router: ReturnType<typeof buildRouter>;

  beforeEach(async () => {
    router = buildRouter();
    await router.push(ROUTES.TOP);
  });

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
                categoryDate: initialCategoryData,
                ...surveyState,
              },
            },
          }),
        ],
        ...globalStubs,
      },
    });

  // ─── 初期表示 ──────────────────────────────────────────────────

  it('名前入力欄が空の状態で表示される', () => {
    const wrapper = createWrapper();
    expect((wrapper.find('#name-input').element as HTMLInputElement).value).toBe('');
  });

  it('store に保存済みのユーザー名が入力欄に反映される', () => {
    const wrapper = createWrapper({ userName: '山田太郎' });
    expect((wrapper.find('#name-input').element as HTMLInputElement).value).toBe('山田太郎');
  });

  // ─── バリデーション ───────────────────────────────────────────────

  it('名前未入力でボタンをクリックするとエラーが表示される', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.start-button').trigger('click');
    expect(wrapper.find('.error-message').exists()).toBe(true);
  });

  it('スペースのみの入力はエラーになる', async () => {
    const wrapper = createWrapper();
    await wrapper.find('#name-input').setValue(' ');
    await wrapper.find('.start-button').trigger('click');
    expect(wrapper.find('.error-message').exists()).toBe(true);
  });

  it('送信試行後に名前を入力するとエラーがリアルタイムで消える', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.start-button').trigger('click');
    expect(wrapper.find('.error-message').exists()).toBe(true);

    await wrapper.find('#name-input').setValue('山田太郎');
    await wrapper.find('#name-input').trigger('input');
    expect(wrapper.find('.error-message').exists()).toBe(false);
  });

  // ─── カテゴリ選択 ────────────────────────────────────────────────

  it('エンジニアカードにチェックを入れると active クラスが付く', async () => {
    const wrapper = createWrapper();
    const [enginnerCheckbox] = wrapper.findAll('input[type="checkbox"]');
    await enginnerCheckbox!.setValue(true);
    expect(wrapper.findAll('.category-card')[0]!.classes()).toContain('active');
  });

  it('デザイナーカードにチェックを入れると active クラスが付く', async () => {
    const wrapper = createWrapper();
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true);
    expect(wrapper.findAll('.category-card')[1]!.classes()).toContain('active');
  });

  it('エンジニアカードをチェックすると store.isEngineerSelected が true になる', async () => {
    const wrapper = createWrapper();
    const store = useSurveyStore();
    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true);
    expect(store.isEngineerSelected).toBe(true);
  });

  it('両カードを同時に選択できる', async () => {
    const wrapper = createWrapper();
    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true);
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true);
    const cards = wrapper.findAll('.category-card');
    expect(cards[0]!.classes()).toContain('active');
    expect(cards[1]!.classes()).toContain('active');
  });

  it('チェック済みカードのチェックを外すと active クラスが消える', async () => {
    const enginnerCheckedData = initialCategoryData.map((c) =>
      c.id === CATEGORIES.ENGINEER.id ? { ...c, isChecked: true } : c,
    );
    const wrapper = createWrapper({ categoryData: enginnerCheckedData });
    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(false);
    expect(wrapper.findAll('.category-card')[0]!.classes()).not.toContain('active');
  });

  // ─── 画面遷移・ストア更新 ────────────────────────────────────────────

  it('有効な名前でボタンをクリックすると SurveyPage へ遷移する', async () => {
    const wrapper = createWrapper();
    await wrapper.find('#name-input').setValue('山田太郎');
    await wrapper.find('.start-button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(ROUTES.SURVEY);
  });

  it('遷移時に store.userName が更新される', async () => {
    const wrapper = createWrapper();
    const store = useSurveyStore();
    await wrapper.find('#name-input').setValue('山田太郎');
    await wrapper.find('.start-button').trigger('click');
    await flushPromises();
    expect(store.userName).toBe('山田太郎');
  });

  it('名前の前後スペースはトリミングされて保存される', async () => {
    const wrapper = createWrapper();
    const store = useSurveyStore();
    await wrapper.find('#name-input').setValue('　山田太郎　');
    await wrapper.find('.start-button').trigger('click');
    await flushPromises();
    expect(store.userName).toBe('山田太郎');
  });

  it('バリデーションエラー時は遷移しない', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.start-button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP);
  });
});
