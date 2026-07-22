import * as apiUtils from '@/utils/api';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { usePdfStatus } from './usePdfStatus';

describe('usePdfStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sheetId が null の間は waiting のまま', () => {
    const sheetId = ref<string | null>(null);
    const { state } = usePdfStatus(sheetId);
    expect(state.value).toBe('waiting');
  });

  it('sheetId が設定されると generating に遷移する', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockReturnValue(new Promise(() => {}));
    const sheetId = ref<string | null>('sheet-1');
    const { state } = usePdfStatus(sheetId);
    await flushPromises();
    expect(state.value).toBe('generating');
  });

  it('ready が返ると ready になり downloadUrl がセットされる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({
      status: 'ready',
      downloadUrl: 'https://example.com/skill.pdf',
    });
    const sheetId = ref<string | null>('sheet-1');
    const { state, downloadUrl } = usePdfStatus(sheetId);
    await flushPromises();
    expect(state.value).toBe('ready');
    expect(downloadUrl.value).toBe('https://example.com/skill.pdf');
  });

  it('generating が続く場合は一定間隔でポーリングする', async () => {
    const fetchSpy = vi
      .spyOn(apiUtils, 'fetchPdfStatus')
      .mockResolvedValue({ status: 'generating' });
    const sheetId = ref<string | null>('sheet-1');
    usePdfStatus(sheetId);
    await flushPromises();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('一定回数ポーリングしても ready にならない場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' });
    const sheetId = ref<string | null>('sheet-1');
    const { state } = usePdfStatus(sheetId);
    await flushPromises();

    // MAX_POLL_COUNT(20) に達するまで残り19回分を進める
    for (let i = 0; i < 19; i++) {
      vi.advanceTimersByTime(3000);
      await flushPromises();
    }

    expect(state.value).toBe('error');
  });

  it('fetchPdfStatus が null を返す場合は error になる', async () => {
    vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue(null);
    const sheetId = ref<string | null>('sheet-1');
    const { state } = usePdfStatus(sheetId);
    await flushPromises();
    expect(state.value).toBe('error');
  });

  describe('retry', () => {
    it('regenerate 成功時はポーリングを再開する', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' });
      vi.spyOn(apiUtils, 'regeneratePdf').mockResolvedValue(true);
      const sheetId = ref<string | null>('sheet-1');
      const { state, retry } = usePdfStatus(sheetId);
      await flushPromises();

      await retry();
      expect(state.value).toBe('generating');
      expect(apiUtils.regeneratePdf).toHaveBeenCalledWith('sheet-1');
    });

    it('regenerate 失敗時は error になる', async () => {
      vi.spyOn(apiUtils, 'fetchPdfStatus').mockResolvedValue({ status: 'generating' });
      vi.spyOn(apiUtils, 'regeneratePdf').mockResolvedValue(false);
      const sheetId = ref<string | null>('sheet-1');
      const { state, retry } = usePdfStatus(sheetId);
      await flushPromises();

      await retry();
      expect(state.value).toBe('error');
    });
  });
});
