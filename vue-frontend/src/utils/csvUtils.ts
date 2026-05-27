import { LEVEL_LABELS } from '@/utils/constants';
import type { SurveyData } from '@/types';

// ========================================
// CSV変換・ダウンロード
// ========================================

/**
 * アンケートデータをCSV形式の文字列に変換する関数。
 * @param {SurveyData} surveyData - アンケートデータ
 * @returns {string} CSV形式の文字列
 * @throws {Error} 変換に失敗した場合
 */

export const convertToCSV = (surveyData: SurveyData): string => {
  try {
    // ヘッダー行
    const header = [['ユーザー名', surveyData.userName], []];

    // 習熟度説明行
    const labels = [
      ['習熟度の説明'],
      ...LEVEL_LABELS.map((level) => [level.stars, level.text]),
      [],
    ];

    const tableHeader = ['カテゴリ', '質問', 'スキル', '習熟度'];
    const body = surveyData.categories
      .filter((category) => category.isChecked)
      .flatMap((category) => {
        let categoryShown = false; // カテゴリ行表示済フラグ
        return category.questions.flatMap((question) => {
          const checkedAnswers = question.answers.filter((answer) => answer.isChecked);
          let questionShown = false; // 質問行表示済フラグ
          return checkedAnswers.map((answer) => {
            const level = answer.value ? LEVEL_LABELS[answer.value - 1] : undefined;
            const row = [
              !categoryShown ? category.genre : '',
              !questionShown ? question.questionText : '',
              answer.label,
              level ? level.stars : '',
            ];
            categoryShown = true;
            questionShown = true;
            return row;
          });
        });
      });

    const rows = [...header, ...labels, [tableHeader], ...body];
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const correctValue = String(cell ?? '').replace(/"/g, '""');
            return `"${correctValue}"`;
          })
          .join(','),
      )
      .join('\r\n');

    return '\uFEFF' + csvContent; // BOM付きUTF-8（Excelでの文字化け防止）
  } catch (error) {
    console.error('CSV変換エラー:', error);
    throw new Error('CSVへの変換に失敗しました');
  }
};

/**
 * アンケートデータをCSVファイルとしてダウンロードする関数。
 * @param {SurveyData} surveyData - アンケートデータ
 * @returns {boolean} ダウンロード成功の有無
 */

export const downloadCSV = (surveyData: SurveyData): boolean => {
  try {
    // データ検証
    if (!surveyData || !surveyData.userName || !surveyData.categories) {
      console.error('無効なデータ:', surveyData);
      return false;
    }

    // CSV変換
    const csv = convertToCSV(surveyData);

    // Blob作成
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // ファイル名生成（ユーザー名_スキルシート_日付.csv）
    const date = new Date();
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `${surveyData.userName}様_スキルシート_${dateString}.csv`;

    // ダウンロード実行
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    document.body.removeChild(link);

    // メモリ解放（少し遅延させる）
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    console.info('CSVダウンロード成功:', fileName);
    return true;
  } catch (error) {
    console.error('CSVダウンロードエラー:', error);
    return false;
  }
};
