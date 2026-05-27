import { describe, expect, it } from 'vitest';
import AnimatedIconButton from './AnimatedIconButton.vue';
import { mount } from '@vue/test-utils';
import { globalStubs } from '@/test/utils';

describe('AnimatedIconButton', () => {
  it('ラベルが表示される', () => {
    const wrapper = mount(AnimatedIconButton, {
      props: { icon: 'fa-solid fa-check', label: 'テストボタン' },
      ...globalStubs,
    });
    expect(wrapper.find('.button-text').text()).toBe('テストボタン');
  });

  it('クリック時に click イベントが emit される', async () => {
    const wrapper = mount(AnimatedIconButton, {
      props: { icon: 'fa-solid fa-check', label: 'テストボタン' },
      ...globalStubs,
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('buttonClass が button 要素に適用される', () => {
    const wrapper = mount(AnimatedIconButton, {
      props: { icon: 'fa-solid fa-check', label: 'テストボタン', buttonClass: 'custom-class' },
      ...globalStubs,
    });
    expect(wrapper.find('button').classes()).toContain('custom-class');
  });
});
