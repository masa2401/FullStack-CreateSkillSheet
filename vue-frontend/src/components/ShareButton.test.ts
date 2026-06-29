import { globalStubs } from '@/test/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ShareButton from './ShareButton.vue';

const createWrapper = () =>
  mount(ShareButton, {
    global: {
      ...globalStubs.global,
      stubs: {
        ...globalStubs.global.stubs,
        AnimatedIconButton: {
          name: 'AnimatedIconButton',
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          emits: ['click'],
        },
        ShareUrlButton: {
          name: 'ShareUrlButton',
          template: '<div class="share-url-button-stub" />',
          emits: ['done'],
        },
        CsvButton: {
          name: 'CsvButton',
          template: '<div class="csv-button-stub" />',
          emits: ['done'],
        },
      },
    },
  });

describe('ShareButton', () => {
  it('初期状態ではメニューが非表示', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.share-menu').exists()).toBe(false);
  });

  it('ボタンクリックでメニューが表示される', async () => {
    const wrapper = createWrapper();
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    expect(wrapper.find('.share-menu').exists()).toBe(true);
  });

  it('メニューを再度クリックすると閉じる', async () => {
    const wrapper = createWrapper();
    const button = wrapper.findComponent({ name: 'AnimatedIconButton' });
    await button.trigger('click');
    await button.trigger('click');
    expect(wrapper.find('.share-menu').exists()).toBe(false);
  });

  it('ShareUrlButton と CsvButton がメニュー内に表示される', async () => {
    const wrapper = createWrapper();
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    expect(wrapper.find('.share-url-button-stub').exists()).toBe(true);
    expect(wrapper.find('.csv-button-stub').exists()).toBe(true);
  });

  it('done イベントを受け取るとメニューが閉じる', async () => {
    const wrapper = createWrapper();
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    expect(wrapper.find('.share-menu').exists()).toBe(true);
    wrapper.findComponent({ name: 'ShareUrlButton' }).vm.$emit('done');
    await nextTick();
    expect(wrapper.find('.share-menu').exists()).toBe(false);
  });
});
