import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MenuItemButton from './MenuItemButton.vue';

const createWrappper = (props = {}) =>
  mount(MenuItemButton, {
    props: { icon: 'fa-solid fa-check', text: 'テスト', ...props },
    grobal: { stubs: { 'font-awesome-icon': true } },
  });

describe('MenuItemButton', () => {
  it('text が表示される', () => {
    const wrapper = createWrappper({ text: 'ラベル' });
    expect(wrapper.find('.menu-item').text()).toBe('ラベル');
  });

  it('variant が success のとき success クラスが付く', () => {
    const wrapper = createWrappper({ variant: 'success' });
    expect(wrapper.find('.menu-item').classes()).toContain('success');
  });

  it('variant が error のとき error クラスが付く', () => {
    const wrapper = createWrappper({ variant: 'error' });
    expect(wrapper.find('.menu-item').classes()).toContain('error');
  });

  it('disabled が true のとき disabled 属性が付く', () => {
    const wrapper = createWrappper({ disabled: true });
    expect((wrapper.find('.menu-item').element as HTMLButtonElement).disabled).toBe(true);
  });

  it('クリック時に click イベントが emit される', async () => {
    const wrapper = createWrappper();
    await wrapper.find('.menu-item').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
