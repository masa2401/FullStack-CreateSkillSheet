import * as csvUtils from '@/utils/csvUtils';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CsvButton from './CsvButton.vue';

const createWrapper = () =>
  mount(CsvButton, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            survey: { userName: 'テストユーザー', selections: [] },
          },
        }),
      ],
      stubs: { 'font-awesome-icon': true },
    },
  });

describe('CsvButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 表示 ────────────────────────────────────────────────────

  it('初期状態では「CSVとして保存」と表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.menu-text').text()).toBe('CSVとして保存');
  });

  it('初期状態では success クラスがない', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.menu-item').classes()).not.toContain('success');
  });

  // ─── ダウンロード成功 ──────────────────────────────────────────

  it('ダウンロード成功時に success クラスが付与される', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true);
    const wrapper = createWrapper();
    await wrapper.find('.menu-item').trigger('click');
    expect(wrapper.find('.menu-item').classes()).toContain('success');
  });

  it('ダウンロード成功時に「ダウンロード完了」と表示される', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true);
    const wrapper = createWrapper();
    await wrapper.find('.menu-item').trigger('click');
    expect(wrapper.find('.menu-text').text()).toBe('ダウンロード完了');
  });

  it('ダウンロード失敗時は success クラスが付与されない', async () => {
    vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false);
    const wrapper = createWrapper();
    await wrapper.find('.menu-item').trigger('click');
    expect(wrapper.find('.menu-item').classes()).not.toContain('success');
  });

  // ─── 自動クローズ ──────────────────────────────────────────────

  describe('成功後の自動クローズ', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('成功の2秒後に done イベントが emit される', async () => {
      vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true);
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');

      expect(wrapper.emitted('done')).toBeUndefined();
      vi.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('done')).toBeTruthy();
    });

    it('失敗時は done イベントが emit されない', async () => {
      vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false);
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');

      vi.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('done')).toBeUndefined();
    });
  });
});
