import { CATEGORY_MASTER_BY_ID } from '@/data/questions';
import type { CategorySelection } from '@/types';
import { LEVEL_LABELS } from '@/utils/constants';

export const convertToCSV = (userName: string, selections: CategorySelection[]): string => {
  try {
    const header = [['ユーザー名', userName], []];

    const labels = [
      ['習熟度の説明'],
      ...LEVEL_LABELS.map((level) => [level.stars, level.text]),
      [],
    ];

    const tableHeader = ['カテゴリ', '質問', 'スキル', '習熟度'];

    const body = selections
      .filter((sel) => sel.isChecked)
      .flatMap((sel) => {
        // カテゴリマスターを引き当て
        const categoryMaster = CATEGORY_MASTER_BY_ID.get(sel.categoryId);
        if (!categoryMaster) return [];

        let categoryShown = false;

        return sel.questions.flatMap((qSel) => {
          // 質問マスターを引き当て
          const questionDef = categoryMaster.questions.find((q) => q.id === qSel.questionId);
          if (!questionDef) return [];

          const checkedAnswers = qSel.answers.filter((a) => a.isChecked);
          let questionShown = false;

          return checkedAnswers.flatMap((aSel) => {
            // 回答マスターを引き当て
            const answerDef = questionDef.answers.find((a) => a.id === aSel.answerId);
            if (!answerDef) return [];

            const level = aSel.value ? LEVEL_LABELS[aSel.value - 1] : undefined;

            const row = [
              !categoryShown ? categoryMaster.genre : '',
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

    return '\uFEFF' + csvContent;
  } catch (error) {
    console.error('CSV変換エラー:', error);
    throw new Error('CSVへの変換に失敗しました');
  }
};

export const downloadCSV = (userName: string, selections: CategorySelection[]): boolean => {
  try {
    if (!userName || !selections.length) {
      console.error('無効なデータ');
      return false;
    }

    const csv = convertToCSV(userName, selections);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateString = new Date().toISOString().split('T')[0];
    const fileName = `${userName}様_スキルシート_${dateString}.csv`;

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
