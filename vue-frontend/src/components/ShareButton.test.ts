import { globalStubs } from '@/test/utils';
import type { SurveyData } from '@/types';
import * as apiUtils from '@/utils/api';
import * as shareUtils from '@/utils/shareUtils';
import { flushPromises, mount, type ComponentMountingOptions } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShareButton from './ShareButton.vue';
// ─── テスト用定数 ────────────────────────────────────────────────

const mockSurveyData: SurveyData = { userName: 'テスト', categories: [] };

const animatedButtonStub = {
  name: 'AnimatedIconButton',
  template: '<button @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
};

const defaultStubs = {
  'font-awesome-icon': true,
  AnimatedIconButton: animatedButtonStub,
};

// ─── ストアモック ────────────────────────────────────────────────

const mockGetSavedIdOrSave = vi.fn();

vi.mock('@/stores/useSurveyStore', () => ({
  useSurveyStore: () => ({
    getSavedIdOrSave: mockGetSavedIdOrSave,
  }),
}));

// ─── ヘルパー ────────────────────────────────────────────────────

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

/** メニューが開いた状態のラッパーを返す */
const createOpenMenuWrapper = async (
  options: ComponentMountingOptions<typeof ShareButton> = {},
) => {
  const wrapper = createWrapper({
    ...options,
    global: {
      stubs: { ...defaultStubs, ...options.global?.stubs },
    },
  });
  await wrapper.findComponent({ name: 'AnimatedIconButton' }).trigger('click');
  return wrapper;
};

// ─── テスト ──────────────────────────────────────────────────────

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(shareUtils, 'createShareUrl').mockReturnValue('https://example.com');
    vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);
    mockGetSavedIdOrSave.mockResolvedValue('sheet-id-123');
  });

  // ─── 表示制御 ─────────────────────────────────────────────────

  describe('メニューの表示制御', () => {
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
      const wrapper = await createOpenMenuWrapper();
      const button = wrapper.findComponent({ name: 'AnimatedIconButton' });

      await button.trigger('click');
      expect(wrapper.find('.share-menu').exists()).toBe(false);
    });

    it('メニューを開くと成功状態がリセットされる', async () => {
      vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);

      const wrapper = await createOpenMenuWrapper();
      // URLコピーを成功させる
      await wrapper.findAll('.menu-item')[0]?.trigger('click');
      await wrapper.vm.$nextTick();

      // メニューを閉じて再度開く
      const button = wrapper.findComponent({ name: 'AnimatedIconButton' });
      await button.trigger('click');
      await button.trigger('click');

      // success クラスがリセットされている
      expect(wrapper.findAll('.menu-item')[0]?.classes()).not.toContain('success');
    });

    // ─── URLコピー（バックエンドなし） ─────────────────────────────

    describe('URLコピー - バックエンド無効時', () => {
      beforeEach(() => {
        vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);
      });

      it('コピー成功時に success クラスが付与される', async () => {
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);

        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[0]?.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.menu-item')[0]?.classes()).toContain('success');
      });

      it('コピー成功時に createShareUrl が呼ばれる', async () => {
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
        const createShareUrlSpy = vi.spyOn(shareUtils, 'createShareUrl');

        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[0]?.trigger('click');
        await flushPromises();

        expect(createShareUrlSpy).toHaveBeenCalledWith(mockSurveyData);
      });

      it('コピー失敗時は success クラスが付与されない', async () => {
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(false);

        const wrapper = await createOpenMenuWrapper();
        await flushPromises();

        expect(wrapper.findAll('.menu-item')[0]?.classes()).not.toContain('success');
      });
    });

    // ─── URLコピー（バックエンドあり） ─────────────────────────────

    describe('URLコピー - バックエンド有効時', () => {
      beforeEach(() => {
        vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
      });

      it('getSavedIdOrSave が呼ばれる', async () => {
        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[0]?.trigger('click');
        await flushPromises();

        expect(mockGetSavedIdOrSave).toHaveBeenCalled();
      });

      it('IDベースの URL がクリップボードへコピーされる', async () => {
        const copyToClipboardSpy = vi.spyOn(shareUtils, 'copyToClipboard');

        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[0]?.trigger('click');
        await flushPromises();

        expect(copyToClipboardSpy).toHaveBeenCalledWith(expect.stringContaining('id=sheet-id-123'));
      });

      it('バックエンド失敗時は createShareUrl にフォールバックする', async () => {
        mockGetSavedIdOrSave.mockRejectedValue(new Error('保存に失敗しました'));
        const createShareUrlSpy = vi.spyOn(shareUtils, 'createShareUrl');

        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[0]?.trigger('click');
        await flushPromises();

        expect(createShareUrlSpy).toHaveBeenCalledWith(mockSurveyData);
      });
    });

    // ─── 多重送信抑制 ──────────────────────────────────────────────

    // describe('多重送信の抑制', () => {});

    // ─── CSV ダウンロード ─────────────────────────────────────────

    // describe('CSV ダウンロード', () => {});

    // ─── 自動クローズ ──────────────────────────────────────────────

    // describe('成功後の自動クローズ', () => {});
  });
});
