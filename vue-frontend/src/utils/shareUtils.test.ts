import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encodeData, decodeData, createShareUrl, copyToClipboard } from './shareUtils';
import type { SurveyData } from '@/types';

const mockSurveyData: SurveyData = {
  userName: 'テストユーザー',
  categories: [
    {
      id: 1,
      genre: '共通の質問',
      isChecked: true,
      questions: [
        {
          id: 1,
          questionText: 'Q1 テスト質問',
          answers: [{ label: 'テスト回答', isChecked: true, value: 3 }],
        },
      ],
    },
  ],
};

describe('encodeData', () => {
  it('エンコード結果が文字列で返る', () => {
    const result = encodeData(mockSurveyData);
    expect(typeof result).toBe('string');
  });

  it('空のuserNameはエンコードできる', () => {
    const data = { ...mockSurveyData, userName: '' };
    const result = encodeData(data);
    expect(result).not.toBeNull();
  });
});

describe('decodeData', () => {
  it('エンコード→デコードで元のデータに戻る', () => {
    const encoded = encodeData(mockSurveyData)!;
    const decoded = decodeData(encoded);
    expect(decoded).toEqual(mockSurveyData);
  });

  it('不正な文字列はnullを返す', () => {
    const result = decodeData('invalid-string');
    expect(result).toBeNull();
  });
});

describe('createShareUrl', () => {
  const url = createShareUrl(mockSurveyData);

  it('data パラメータを含む URL が生成される', () => {
    expect(url).toContain('data=');
  });

  it('result ページへのハッシュが含まれる', () => {
    expect(url).toContain('#/result');
  });
});

describe('copyToClipboard', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    mockWriteText.mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('コピー成功時に true を返す', async () => {
    const result = await copyToClipboard('https://example.com');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com');
  });

  it('コピー失敗時に false を返す', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText.mockRejectedValue(new Error('denied')) },
    });
    const result = await copyToClipboard('https://example.com');
    expect(result).toBe(false);
  });

  it('clipboard が未サポートの場合は false を返す', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined });
    const result = await copyToClipboard('https://example.com');
    expect(result).toBe(false);
  });
});
