import { CATEGORY_MASTER_BY_ID } from '@/data/questions';
import type { CategorySelection } from '@/types';
import { LEVEL_LABELS } from '@/utils/constants';

export const convertToCSV = (userName: string, selections: CategorySelection[]): string => {
  try {
    const rows: string[][] = [
      ['ユーザー名', userName],
      [],
      ['習熟度の説明'],
      ...LEVEL_LABELS.map((level) => [level.stars, level.text]),
      [],
      ['カテゴリ', '質問項目', 'スキル・技術要素', '習熟度'],
    ];

    const body = selections
      .filter((sel) => sel.isChecked)
      .flatMap((sel) => {
        const categoryMaster = CATEGORY_MASTER_BY_ID.get(sel.categoryId);
        if (!categoryMaster) return [];

        let categoryShown = false;
        return sel.questions.flatMap((qSel) => {
          const questionDef = categoryMaster.questions.find((q) => q.id === qSel.questionId);
          if (!questionDef) return [];

          const checkedAnswers = qSel.answers.filter((a) => a.isChecked);
          if (checkedAnswers.length === 0) return [];

          let questionShown = false;
          return checkedAnswers.flatMap((aSel) => {
            const answerDef = questionDef.answers.find((a) => a.id === aSel.answerId);
            if (!answerDef) return [];

            const level = aSel.value ? LEVEL_LABELS[aSel.value - 1] : undefined;
            const row = [
              !categoryShown ? categoryMaster.label : '',
              !questionShown ? questionDef.questionText : '',
              answerDef.label,
              level ? level.stars : '',
            ];
            categoryShown = true;
            questionShown = true;
            return [row];
          });
        });
      });
    rows.push(...body);
    return rows
      .map((row) =>
        row
          .map((cell) => {
            const correctValue = String(cell ?? '').replace(/"/g, '""');
            return `"${correctValue}"`;
          })
          .join(','),
      )
      .join('\r\n');
  } catch (error) {
    console.error('CSV変換エラー:', error);
    throw new Error('CSVへの変換に失敗しました');
  }
};

/**
 * CSVファイルをダウンロードする
 */
export const downloadCSV = (userName: string, selections: CategorySelection[]): boolean => {
  try {
    if (!userName || !selections || !selections.length) {
      console.error('無効なデータ');
      return false;
    }
    const rawUserName = JSON.parse(JSON.stringify(userName)) as string;
    const rawSelections = JSON.parse(JSON.stringify(selections)) as CategorySelection[];
    const csv = convertToCSV(rawUserName, rawSelections);
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(csv);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, uint8Array], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateString = new Date().toISOString().split('T')[0];
    const fileName = `${rawUserName}様_スキルシート_${dateString}.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    console.info('CSVダウンロード成功:', fileName);
    return true;
  } catch (error) {
    console.error('CSVダウンロードエラー:', error);
    return false;
  }
};
