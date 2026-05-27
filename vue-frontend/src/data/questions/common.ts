import type { Question } from '@/types';

export const commonQuestions: Question[] = [
  {
    id: 1,
    questionText: 'Q1. 実務で使用経験のあるオフィスソフトを全て選択してください。',
    answers: [
      'Microsoft Word （報告書・議事録作成など）',
      'Microsoft Excel （関数、ピボットテーブル、グラフ作成など）',
      'Microsoft PowerPoint （提案資料・プレゼン資料作成など）',
      'Google Workspace (ドキュメント, スプレッドシート, スライド)',
    ],
  },
  {
    id: 2,
    questionText:
      'Q2. 業務で日常的に使用したことのあるコミュニケーションツールを全て選択してください。',
    answers: ['Slack', 'Microsoft Teams', 'Zoom', 'Google Meet'],
  },
  {
    id: 3,
    questionText: 'Q3. 以下のIT関連知識・スキルについて、当てはまるものを全て選択してください。',
    answers: [
      'Windowsの基本操作・設定ができる',
      'macOSの基本操作・設定ができる',
      'PCの簡単なパーツ交換（メモリ増設、ストレージ交換など）が可能',
      'ネットワークの基礎知識（IPアドレス、DNSなど）を理解している',
      '基本的なセキュリティ対策（パスワード管理、フィッシング対策など）を実践している',
    ],
  },
];
