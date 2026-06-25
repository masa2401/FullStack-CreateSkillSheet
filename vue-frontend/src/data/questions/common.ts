import type { Question } from '@/types';

export const commonQuestions: Question[] = [
  {
    id: 1,
    questionText: 'Q1. 実務で使用経験のあるオフィスソフトを全て選択してください。',
    answers: [
      { id: 1, label: 'Microsoft Word （報告書・議事録作成など）' },
      { id: 2, label: 'Microsoft Excel （関数、ピボットテーブル、グラフ作成など）' },
      { id: 3, label: 'Microsoft PowerPoint （提案資料・プレゼン資料作成など）' },
      { id: 4, label: 'Google Workspace (ドキュメント, スプレッドシート, スライド)' },
    ],
  },
  {
    id: 2,
    questionText:
      'Q2. 業務で日常的に使用したことのあるコミュニケーションツールを全て選択してください。',
    answers: [
      { id: 1, label: 'Slack' },
      { id: 2, label: 'Microsoft Teams' },
      { id: 3, label: 'Zoom' },
      { id: 4, label: 'Google Meet' },
    ],
  },
  {
    id: 3,
    questionText: 'Q3. 以下のIT関連知識・スキルについて、当てはまるものを全て選択してください。',
    answers: [
      { id: 1, label: 'Windowsの基本操作・設定ができる' },
      { id: 2, label: 'macOSの基本操作・設定ができる' },
      { id: 3, label: 'PCの簡単なパーツ交換（メモリ増設、ストレージ交換など）が可能' },
      { id: 4, label: 'ネットワークの基礎知識（IPアドレス、DNSなど）を理解している' },
      {
        id: 5,
        label: '基本的なセキュリティ対策（パスワード管理、フィッシング対策など）を実践している',
      },
    ],
  },
];
