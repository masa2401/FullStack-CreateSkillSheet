import { globalStubs } from '@/test/utils';
import type { SurveyData } from '@/types';
import * as apiUtils from '@/utils/api';
import * as csvUtils from '@/utils/csvUtils.ts';
import * as shareUtils from '@/utils/shareUtils';
import { flushPromises, mount, type ComponentMountingOptions } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.clearAllMocks();
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
        await flushPromises();

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

    describe('多重送信の抑制', () => {
      it('保存中は URL コピーボタンが disabled になる', async () => {
        // 解決しない Promise で「保存中」状態を維持する
        mockGetSavedIdOrSave.mockReturnValue(new Promise(() => {}));
        vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);

        const wrapper = await createOpenMenuWrapper();
        const copyButton = wrapper.findAll('.menu-item')[0]!;

        // await しない → isSaving=true のまま止まる
        copyButton.trigger('click');
        // マイクロタスクを1ステップ進めて isSaving=true がリアクティブに反映されるのを待つ
        await wrapper.vm.$nextTick();

        expect(copyButton.attributes('disabled')).toBeDefined();
      });

      it('保存中に再度クリックしても getSavedIdOrSave は1回しか呼ばれない', async () => {
        let resolvePromise!: (value: string) => void;
        mockGetSavedIdOrSave.mockReturnValue(
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          }),
        );
        vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);

        const wrapper = await createOpenMenuWrapper();
        const copyButton = wrapper.findAll('.menu-item')[0]!;

        // 1回目クリック（保存中になる）
        copyButton.trigger('click');
        await wrapper.vm.$nextTick(); // isSaving=true が反映される

        // disabled 状態なのでクリックイベント自体がブラウザにより無視されるが、
        // テスト環境では trigger が disabled を無視して発火するため
        // disabled チェックを明示的に確認しておく
        expect(copyButton.attributes('disabled')).toBeDefined();
        copyButton.trigger('click'); // 2回目（disabled だが trigger は通る）
        await wrapper.vm.$nextTick();

        // Promise を解決して非同期処理を完了させる
        resolvePromise('sheet-id-123');
        await flushPromises();

        // handleCopy 自体の disabled チェックはないが、
        // disabled ボタンへの trigger が実際にコールを増やしていないことを確認する
        expect(mockGetSavedIdOrSave).toHaveBeenCalledTimes(1);
      });

      it('保存完了後は disabled が解除される', async () => {
        vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(true);
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);

        const wrapper = await createOpenMenuWrapper();
        const copyButton = wrapper.findAll('.menu-item')[0]!;

        await copyButton.trigger('click');
        // finally ブロック（isSaving=false）まで含めて全 Promise を解決する
        await flushPromises();

        expect(copyButton.attributes('disabled')).toBeUndefined();
      });
    });
    // ─── CSV ダウンロード ─────────────────────────────────────────

    describe('CSV ダウンロード', () => {
      it('ダウンロード成功時に success クラスが付与される', async () => {
        vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true);

        const wrapper = await createOpenMenuWrapper();
        // handleDownloadCSV は同期処理なので trigger だけで反映される
        await wrapper.findAll('.menu-item')[1]!.trigger('click');

        expect(wrapper.findAll('.menu-item')[1]!.classes()).toContain('success');
      });

      it('ダウンロード失敗時は success クラスが付与されない', async () => {
        vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(false);

        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[1]!.trigger('click');

        expect(wrapper.findAll('.menu-item')[1]!.classes()).not.toContain('success');
      });
    });
    // ─── 自動クローズ ──────────────────────────────────────────────

    describe('成功後の自動クローズ', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('URLコピー成功の2秒後にメニューが閉じる', async () => {
        vi.spyOn(shareUtils, 'copyToClipboard').mockResolvedValue(true);
        vi.spyOn(apiUtils, 'isBackendEnabled').mockReturnValue(false);

        const wrapper = await createOpenMenuWrapper();
        await wrapper.findAll('.menu-item')[0]?.trigger('click');
        // fakeTimers 環境では Promise のマイクロタスクと setTimeout が混在するため
        // flushPromises で非同期チェーンを先に解決してから timer を進める
        await flushPromises();

        // setTimeout 発火前はメニューがまだ表示されている
        expect(wrapper.find('.share-menu').exists()).toBe(true);

        vi.advanceTimersByTime(2000);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.share-menu').exists()).toBe(false);
      });

      it('CSVダウンロード成功の2秒後にメニューが閉じる', async () => {
        vi.spyOn(csvUtils, 'downloadCSV').mockReturnValue(true);

        const wrapper = await createOpenMenuWrapper();
        // handleDownloadCSV は同期なので trigger で即座に反映される
        await wrapper.findAll('.menu-item')[1]!.trigger('click');

        expect(wrapper.find('.share-menu').exists()).toBe(true);

        vi.advanceTimersByTime(2000);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.share-menu').exists()).toBe(false);
      });
    });
  });
});
