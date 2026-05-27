import type { Question } from '@/types';

export const engineerQuestions: Question[] = [
  {
    id: 1,
    questionText:
      'Q1. 実務で使用経験のあるフロントエンド言語・マークアップ言語を全て選択してください。',
    answers: ['HTML', 'CSS', 'Sass/SCSS', 'JavaScript', 'TypeScript'],
  },
  {
    id: 2,
    questionText: 'Q2. 実務で使用経験のあるバックエンド言語を全て選択してください。',
    answers: ['PHP', 'Ruby', 'Python', 'Java', 'Go'],
  },
  {
    id: 3,
    questionText: 'Q3. 実務で使用経験のあるフレームワーク/ライブラリを全て選択してください。',
    answers: [
      'React',
      'Vue.js',
      'Angular',
      'jQuery',
      'Laravel(PHP)',
      'Ruby on Rails(Ruby)',
      'Django(Python)',
      'SpringBoot(Java)',
    ],
  },
  {
    id: 4,
    questionText: 'Q4. 実務で使用経験のあるデータベースを全て選択してください。',
    answers: ['MySQL / MariaDB', 'PostgreSQL', 'Oracle Database', 'MongoDB', 'Redis'],
  },
  {
    id: 5,
    questionText: 'Q5. 実務で使用経験のあるバージョン管理ツールを全て選択してください。',
    answers: ['Git / GitHub / GitLab', 'Subversion (SVN)', 'Mercurial', 'Perforce'],
  },
  {
    id: 6,
    questionText: 'Q6. サーバーとして構築・運用経験のあるOSを全て選択してください。',
    answers: ['Linux (RHEL/CentOS系)', 'Linux (Ubuntu/Debian系)', 'Windows Server'],
  },
  {
    id: 7,
    questionText:
      'Q7. 主な業務で利用したことのあるクラウドプラットフォームを全て選択してください。',
    answers: ['AWS (Amazon Web Services)', 'Microsoft Azure', 'GCP (Google Cloud Platform)'],
  },
  {
    id: 8,
    questionText: 'Q8. 実務で使用経験のある仮想化・コンテナ技術を全て選択してください。',
    answers: ['VMware vSphere', 'Docker', 'Kubernetes'],
  },
  {
    id: 9,
    questionText: 'Q9. 実務で使用経験のある構成管理・自動化ツールを全て選択してください。',
    answers: ['Ansible', 'Terraform', 'シェルスクリプト (Bashなど)'],
  },
  {
    id: 10,
    questionText:
      'Q10. 実務で設定・運用経験のあるネットワーク機器や監視ツールを全て選択してください。',
    answers: [
      'L2/L3スイッチ (Ciscoなど)',
      'ルーター',
      'ファイアウォール',
      'ロードバランサー',
      'Zabbix',
      'Prometheus / Grafana',
      'Datadog',
    ],
  },
];
