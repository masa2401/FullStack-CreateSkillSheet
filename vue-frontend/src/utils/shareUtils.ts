import type { CategorySelection, SurveyState } from '@/types';
import LZString from 'lz-string';

// ========================================
// 型ガード
// ========================================

const isCategoryState = (value: unknown): value is CategorySelection =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as CategorySelection).categoryId === 'number' &&
  typeof (value as CategorySelection).isChecked === 'boolean' &&
  Array.isArray((value as CategorySelection).questions);

const isSurveyState = (value: unknown): value is SurveyState =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SurveyState).userName === 'string' &&
  !!(value as SurveyState).userName &&
  Array.isArray((value as SurveyState).selections) &&
  (value as SurveyState).selections.every(isCategoryState);

// ========================================
// データの圧縮・展開
// ========================================

/**
 * オブジェクトをJSON文字列に変換し、LZ-stringで圧縮してURL安全なBase64形式でエンコード
 * @param data - 圧縮・エンコード対象のオブジェクト
 * @returns 圧縮・エンコードされた文字列、またはエラーが発生した場合はnull
 */
export const encodeData = (data: SurveyState): string | null => {
  try {
    const jsonString = JSON.stringify(data);
    return LZString.compressToEncodedURIComponent(jsonString);
  } catch (error) {
    console.error('エンコードエラー:', error);
    return null;
  }
};

/**
 * LZ-stringで圧縮されたURL安全なBase64形式の文字列をデコードし、JSONオブジェクトに変換
 * @param compressedString - デコード対象の圧縮・エンコードされた文字列
 * @returns デコードされたオブジェクト、またはエラーが発生した場合はnull
 */
export const decodeData = (compressedString: string): SurveyState | null => {
  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
    if (!jsonString) {
      throw new Error('解凍に失敗しました');
    }
    return JSON.parse(jsonString) as SurveyState;
  } catch (error) {
    console.error('デコードエラー:', error);
    return null;
  }
};

// ========================================
// URL生成・解析
// ========================================

/**
 * SurveyStateオブジェクトをエンコードしてURLのクエリパラメータに埋め込み、結果ページへの完全なURLを生成
 */
export const createShareUrl = (surveyData: SurveyState): string => {
  const encoded = encodeData(surveyData);
  if (!encoded) {
    throw new Error('データのエンコードに失敗しました');
  }
  const url = new URL(window.location.href);
  url.hash = `/result?data=${encoded}`;

  url.search = '';

  return url.toString();
};

/**
 * URLからエンコードされたデータを抽出してデコードし、SurveyStateオブジェクトを返す
 */
export const getDataFromUrl = (): SurveyState | null => {
  try {
    const url = new URL(window.location.href);
    // ハッシュ（#）が含まれていない、またはハッシュ内に『?』が含まれていない場合は処理しない
    if (!url.hash || !url.hash.includes('?')) return null;
    // 『?』で分割し、後半のクエリ文字列（data=xxxx...）を取得する
    const [, hashQuery] = url.hash.split('?');
    if (!hashQuery) return null;
    // クエリ文字列をパースする
    const urlParams = new URLSearchParams(hashQuery);
    const encodedData = urlParams.get('data');
    if (!encodedData) return null;

    const decoded = decodeData(encodedData);
    if (!decoded) {
      console.error('データのデコードに失敗しました。URLが破損している可能性があります。');
      return null;
    }

    if (!isSurveyState(decoded)) {
      console.error('デコードされたデータの構造が無効です');
      return null;
    }
    console.info('URLからデータを正常に取得しました');
    return decoded;
  } catch (error) {
    console.error('URLからのデータ取得中に予期しないエラーが発生しました:', error);
    return null;
  }
};

export const getIdFromUrl = (): string | null => {
  const url = new URL(window.location.href);
  if (!url.hash || !url.hash.includes('?')) return null;

  const [, hashQuery] = url.hash.split('?');
  if (!hashQuery) return null;

  return new URLSearchParams(hashQuery).get('id');
};

// ========================================
// クリップボード操作
// ========================================

/**
 * テキストをクリップボードにコピーするユーティリティ関数
 * @param text - コピーするテキスト
 * @returns コピーが成功したかどうかを示すPromise<boolean>
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('クリップボードコピーエラー:', error.message);
    }
    return false;
  }
};
