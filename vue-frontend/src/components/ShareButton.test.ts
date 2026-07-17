import { useSurveyStore } from '@/stores/useSurveyStore.ts';
import { globalStubs } from '@/test/utils';
import * as apiUtils from '@/utils/api';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import ShareButton from './ShareButton.vue';

const createWrapper = (initialState: Record<string, unknown> = {}) =>
  mount(ShareButton, {
    global: {
      plugins: [
        createTestingPinia({ initialState: { survey: { saveSheetId: null, ...initialState } } }),
      ],
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
        PdfButton: {
          name: 'PdfButton',
          template: '<div class="pdf-button-stub" />',
          emits: ['done'],
        },
      },
    },
  });

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);
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

  // ─── バックエンド無効時 ─────────────────────────────────

  it('バックエンド無効時は PdfButton が表示されない', async () => {
    const wrapper = createWrapper();
    await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
    expect(wrapper.find('.pdf-button-stub').exists()).toBe(false);
  });

  // ─── バックエンド有効時 ─────────────────────────────────

  describe('バックエンド有効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);
    });

    it('PdfButton がメニュー内に表示される', async () => {
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
      expect(wrapper.find('.pdf-button-stub').exists()).toBe(true);
    });

    it('メニューを開くと getSavedIdOrSave が呼ばれる', async () => {
      const wrapper = createWrapper();
      const store = useSurveyStore();
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
      await flushPromises();
      expect(store.getSavedIdOrSave).toHaveBeenCalledOnce();
    });

    it('既に savedSheetId がある場合は getSavedIdOrSave を呼ばない', async () => {
      const wrapper = createWrapper({ savedSheetId: 'already-saved-id' });
      const store = useSurveyStore();
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
      await flushPromises();
      expect(store.getSavedIdOrSave).not.toHaveBeenCalled();
    });

    it('保存に失敗してもメニュー表示は維持される', async () => {
      const wrapper = createWrapper();
      const store = useSurveyStore();
      vi.mocked(store.getSavedIdOrSave).mockRejectedValue(new Error('保存に失敗しました'));
      await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
      await flushPromises();
      expect(wrapper.find('.share-menu').exists()).toBe(true);
    });
  });
});
