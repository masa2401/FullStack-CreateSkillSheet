import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import TheHeader from './TheHeader.vue';
import { ROUTES } from '@/utils/constants';

const buildRouter = async (initialPath = '/') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/survey', component: { template: '<div />' } },
    ],
  });
  await router.push(initialPath);
  return router;
};

describe('TheHeader', () => {
  it('タイトルが表示される', async () => {
    const router = await buildRouter();
    const wrapper = await mount(TheHeader, {
      global: { plugins: [router], stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.find('.title').text()).toContain('スキルシート制作ページ');
  });

  it('トップページ以外でタイトルをクリックするとトップへ遷移する', async () => {
    const router = await buildRouter();
    const wrapper = await mount(TheHeader, {
      global: { plugins: [router], stubs: { 'font-awesome-icon': true } },
    });
    await wrapper.find('.title').trigger('click');
    expect(router.currentRoute.value.path).toBe(ROUTES.TOP);
  });

  it('トップページでタイトルをクリックしても push は呼ばれない', async () => {
    const router = await buildRouter();
    const pushSpy = vi.spyOn(router, 'push');
    const wrapper = await mount(TheHeader, {
      global: { plugins: [router], stubs: { 'font-awesome-icon': true } },
    });
    await wrapper.find('.title').trigger('click');
    expect(pushSpy).not.toHaveBeenCalled();
  });
});
