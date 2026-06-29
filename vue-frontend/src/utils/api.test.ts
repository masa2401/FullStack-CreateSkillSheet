import type { SurveyState } from '@/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkSheetExists, fetchSheet, isBackendEnabled, saveSheet } from './api';

vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');

const mockSurveyState: SurveyState = {
  userName: 'テストユーザー',
  selections: [
    {
      categoryId: 1,
      isChecked: true,
      questions: [
        {
          questionId: 1,
          answers: [{ answerId: 1, isChecked: true, value: 3 }],
        },
      ],
    },
  ],
};

describe('isBackendEnabled', () => {
  it('VITE_API_BASE_URL が設定されている場合は true を返す', () => {
    expect(isBackendEnabled()).toBe(true);
  });
});

describe('saveSheet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('保存成功時に ID を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'abc123' }), { status: 200 }),
    );
    const id = await saveSheet(mockSurveyState);
    expect(id).toBe('abc123');
  });

  it('レスポンスが ok でない場合はエラーを throw する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));
    await expect(saveSheet(mockSurveyState)).rejects.toThrow('保存に失敗しました');
  });

  it('POST リクエストが送信される', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'abc123' }), { status: 200 }));
    await saveSheet(mockSurveyState);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/sheets'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('fetchSheet', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('取得成功時に status: success とデータを返す', async () => {
    const mockDto = {
      userName: 'テストユーザー',
      categories: [
        {
          categoryId: 1,
          questions: [{ questionId: 1, answers: [{ answerId: 1, value: 3 }] }],
        },
      ],
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockDto), { status: 200 }),
    );
    const result = await fetchSheet('abc123');
    expect(result).not.toBeNull();
    expect(result!.status).toBe('success');
    if (result!.status === 'success') expect(result!.data.userName).toBe('テストユーザー');
  });

  it('410 の場合は status: expired を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 410 }));
    const result = await fetchSheet('abd123');
    expect(result).toEqual({ status: 'expired' });
  });

  it('404 の場合は status: notfound を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
    const result = await fetchSheet('abd123');
    expect(result).toEqual({ status: 'notfound' });
  });

  it('ネットワークエラー時は null を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'));
    const result = await fetchSheet('abd123');
    expect(result).toBeNull();
  });
});

describe('checkSheetExists', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('レスポンスが ok の場合は true を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    const result = await checkSheetExists('abc123');
    expect(result).toBe(true);
  });

  it('レスポンスが ok でない場合は false を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
    const result = await checkSheetExists('abc123');
    expect(result).toBe(false);
  });

  it('ネットワークエラー時は false を返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'));
    const result = await checkSheetExists('abc123');
    expect(result).toBe(false);
  });
});
