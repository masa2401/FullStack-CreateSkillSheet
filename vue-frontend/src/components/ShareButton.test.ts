import * as shareUtils from '@/utils/shareUtils';
import * as csvUtils from '@/utils/csvUtils';
import type { SurveyData } from '@/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type ComponentMountingOptions } from '@vue/test-utils';
import ShareButton from './ShareButton.vue';
import { globalStubs } from '@/test/utils';

const mockSurveyData: SurveyData = { userName: 'テスト', categories: [] };
const animatedButtonStub = {
  name: 'AnimatedIconButton',
  template: '<button @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
};

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(shareUtils, 'createShareUrl').mockReturnValue('https://example.com');
  });

  const createWrapper = (options: ComponentMountingOptions<typeof ShareButton> = {}) =>
    mount(ShareButton, {
      props: { surveyData: mockSurveyData },
      ...options,
      global: {
        ...globalStubs.global,
        ...options.global,
        stubs: {
          ...globalStubs.global.stubs,
          ...options.global?.stubs,
        },
      },
    });

  it('初期状態ではメニューが非表示', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.share-menu').exists()).toBe(false);
  });

  it('ボタンクリックでメニューが表示される', async () => {
    const wrapper = createWrapper();
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    expect(wrapper.find('.share-menu').exists()).toBe(true);
  });

  it('URLコピー成功時にコピー完了テキストが表示される', async () => {
    vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);

    const wrapper = createWrapper({
      global: {
        stubs: {
          'font-awesome-icon': true,
          AnimatedIconButton: animatedButtonStub,
        },
      },
    });

    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    await wrapper.findAll('.menu-item')[0]?.trigger('click');
    expect(wrapper.findAll('.menu-item')[0]?.classes()).toContain('success');
  });

  it('CSVダウンロード成功時にダウンロード完了テキストが表示される', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true);

    const wrapper = createWrapper({
      global: {
        stubs: {
          'font-awesome-icon': true,
          AnimatedIconButton: animatedButtonStub,
        },
      },
    });

    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    await wrapper.findAll('.menu-item')[1]!.trigger('click');
    expect(wrapper.findAll('.menu-item')[1]!.classes()).toContain('success');
  });

  it('メニューを再度クリックすると閉じる', async () => {
    const wrapper = createWrapper({
      global: {
        stubs: {
          'font-awesome-icon': true,
          AnimatedIconButton: animatedButtonStub,
        },
      },
    });
    const button = wrapper.findComponent({ name: 'AnimatedIconButton' });

    await button.trigger('click');
    await button.trigger('click');
    expect(wrapper.find('.share-menu').exists()).toBe(false);
  });
});
