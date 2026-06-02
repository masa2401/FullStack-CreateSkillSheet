import LZString from 'lz-string';
import type { CategoryState, SurveyData } from '@/types';
 
// ========================================
// 型ガード
// ========================================
 
const isCategoryState = (value: unknown): value is CategoryState =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as CategoryState).id === 'number' &&
  typeof (value as CategoryState).genre === 'string' &&
  typeof (value as CategoryState).isChecked === 'boolean' &&
  Array.isArray((value as CategoryState).questions);
 
const isSurveyData = (value: unknown): value is SurveyData =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SurveyData).userName === 'string' &&
  !!(value as SurveyData).userName &&
  Array.isArray((value as SurveyData).categories) &&
  (value as SurveyData).categories.every(isCategoryState);
 
// ========================================
// データの圧縮・展開
// ========================================
 
/**
 * オブジェクトをJSON文字列に変換し、LZ-stringで圧縮してURL安全なBase64形式でエンコード
 * @param data - 圧縮・エンコード対象のオブジェクト
 * @returns 圧縮・エンコードされた文字列、またはエラーが発生した場合はnull
 */
export const encodeData = (data: SurveyData): string | null => {
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
export const decodeData = (compressedString: string): SurveyData | null => {
  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
    if (!jsonString) {
      throw new Error('解凍に失敗しました');
    }
    return JSON.parse(jsonString) as SurveyData;
  } catch (error) {
    console.error('デコードエラー:', error);
    return null;
  }
};
 
// ========================================
// URL生成・解析
// ========================================
 
/**
 * SurveyDataオブジェクトをエンコードしてURLのクエリパラメータに埋め込み、結果ページへの完全なURLを生成
 */
export const createShareUrl = (surveyData: SurveyData): string => {
  const encoded = encodeData(surveyData);
  if (!encoded) {
    throw new Error('データのエンコードに失敗しました');
  }
  const url = new URL(window.location.href);
  url.hash = `/result`;
  url.searchParams.set('data', encoded);
  return url.toString();
};
 
/**
 * URLからエンコードされたデータを抽出してデコードし、SurveyDataオブジェクトを返す
 */
export const getDataFromUrl = (): SurveyData | null => {
  try {
    const url = new URL(window.location.href);
    if (!url.hash) return null;
    const [, hashPath] = url.hash.split('?');
    if (!hashPath) return null;
 
    const urlParams = new URLSearchParams(hashPath);
    const encodedData = urlParams.get('data');
    if (!encodedData) return null;
 
    const decoded = decodeData(encodedData);
    if (!decoded) {
      console.error('データのデコードに失敗しました。URLが破損している可能性があります。');
      return null;
    }
 
    if (!isSurveyData(decoded)) {
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