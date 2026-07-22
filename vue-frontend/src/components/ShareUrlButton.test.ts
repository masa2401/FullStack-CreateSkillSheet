import * as apiUtils from '@/utils/api';
import * as shareUtils from '@/utils/shareUtils';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MenuItemButton from './MenuItemButton.vue';
import ShareUrlButton from './ShareUrlButton.vue';

const mockGetSavedIdOrSave = vi.fn();

vi.mock('@/stores/useSurveyStore', () => ({
  useSurveyStore: () => ({
    getSavedIdOrSave: mockGetSavedIdOrSave,
    surveyState: { userName: 'テストユーザー', selections: [] },
  }),
}));

const createWrapper = () =>
  mount(ShareUrlButton, {
    global: {
      plugins: [createTestingPinia()],
      components: { MenuItemButton },
      stubs: { 'font-awesome-icon': true },
    },
  });

describe('ShareUrlButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(shareUtils, 'createShareUrl').mockReturnValue('https://example.com');
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);
    mockGetSavedIdOrSave.mockResolvedValue('sheet-id-123');
  });

  // ─── 表示 ────────────────────────────────────────────────────

  it('初期状態では「URLをコピー」と表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.menu-text').text()).toBe('URLをコピー');
  });

  it('初期状態では disabled ではない', () => {
    const wrapper = createWrapper();
    expect((wrapper.find('.menu-item').element as HTMLButtonElement).disabled).toBe(false);
  });

  // ─── バックエンド無効時 ────────────────────────────────────────

  describe('バックエンド無効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);
    });

    it('コピー成功時に success クラスが付与される', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect(wrapper.find('.menu-item').classes()).toContain('success');
    });

    it('コピー成功時に createShareUrl が呼ばれる', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
      const createShareUrlSpy = vi.spyOn(shareUtils, 'createShareUrl');
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect(createShareUrlSpy).toHaveBeenCalled();
    });

    it('コピー失敗時は success クラスが付与されない', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(false);
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect(wrapper.find('.menu-item').classes()).not.toContain('success');
    });
  });

  // ─── バックエンド有効時 ────────────────────────────────────────

  describe('バックエンド有効時', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
    });

    it('getSavedIdOrSave が呼ばれる', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect(mockGetSavedIdOrSave).toHaveBeenCalled();
    });

    it('IDベースの URL がクリップボードへコピーされる', async () => {
      const copyToClipboardSpy = vi.spyOn(shareUtils, 'copyToClipboard');
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect(copyToClipboardSpy).toHaveBeenCalledWith(expect.stringContaining('id=sheet-id-123'));
    });

    it('バックエンド失敗時は createShareUrl にフォールバックする', async () => {
      mockGetSavedIdOrSave.mockRejectedValue(new Error('保存に失敗しました'));
      const createShareUrlSpy = vi.spyOn(shareUtils, 'createShareUrl');
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect(createShareUrlSpy).toHaveBeenCalled();
    });
  });

  // ─── 多重送信抑制 ──────────────────────────────────────────────

  describe('多重送信の抑制', () => {
    beforeEach(() => {
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);
    });

    it('保存中は disabled になる', async () => {
      mockGetSavedIdOrSave.mockReturnValue(new Promise(() => {}));
      const wrapper = createWrapper();
      wrapper.find('.menu-item').trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.find('.menu-item').element as HTMLButtonElement).disabled).toBe(true);
    });

    it('保存中に再度クリックしても getSavedIdOrSave は1回しか呼ばれない', async () => {
      let resolvePromise!: (value: string) => void;
      mockGetSavedIdOrSave.mockReturnValue(
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        }),
      );
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);

      const wrapper = createWrapper();
      const button = wrapper.find('.menu-item');

      button.trigger('click');
      await wrapper.vm.$nextTick();

      button.trigger('click');
      await wrapper.vm.$nextTick();

      resolvePromise('sheet-id-123');
      await flushPromises();

      expect(mockGetSavedIdOrSave).toHaveBeenCalledTimes(1);
    });

    it('保存完了後は disabled が解除される', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();
      expect((wrapper.find('.menu-item').element as HTMLButtonElement).disabled).toBe(false);
    });
  });

  // ─── 自動クローズ ──────────────────────────────────────────────

  describe('成功後の自動クローズ', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('コピー成功の2秒後に done イベントが emit される', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.menu-item').trigger('click');
      await flushPromises();

      expect(wrapper.emitted('done')).toBeUndefined();
      vi.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('done')).toBeTruthy();
    });
  });
});
