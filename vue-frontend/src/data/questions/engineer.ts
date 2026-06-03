import type { Question } from '@/types';

export const engineerQuestions: Question[] = [
  {
    id: 1,
    questionText:
      'Q1. 実務で使用経験のあるフロントエンド言語・マークアップ言語を全て選択してください。',
    answers: [
      { label: 'HTML' },
      { label: 'CSS' },
      { label: 'Sass/SCSS' },
      { label: 'JavaScript' },
      { label: 'TypeScript' },
    ],
  },
  {
    id: 2,
    questionText: 'Q2. 実務で使用経験のあるバックエンド言語を全て選択してください。',
    answers: [
      { label: 'PHP' },
      { label: 'Ruby' },
      { label: 'Python' },
      { label: 'Java' },
      { label: 'Go' },
    ],
  },
  {
    id: 3,
    questionText: 'Q3. 実務で使用経験のあるフレームワーク/ライブラリを全て選択してください。',
    answers: [
      { label: 'React' },
      { label: 'Vue.js' },
      { label: 'Angular' },
      { label: 'jQuery' },
      { label: 'Laravel(PHP)' },
      { label: 'Ruby on Rails(Ruby)' },
      { label: 'Django(Python)' },
      { label: 'SpringBoot(Java)' },
    ],
  },
  {
    id: 4,
    questionText: 'Q4. 実務で使用経験のあるデータベースを全て選択してください。',
    answers: [
      { label: 'MySQL / MariaDB' },
      { label: 'PostgreSQL' },
      { label: 'Oracle Database' },
      { label: 'MongoDB' },
      { label: 'Redis' },
    ],
  },
  {
    id: 5,
    questionText: 'Q5. 実務で使用経験のあるバージョン管理ツールを全て選択してください。',
    answers: [
      { label: 'Git / GitHub / GitLab' },
      { label: 'Subversion (SVN)' },
      { label: 'Mercurial' },
      { label: 'Perforce' },
    ],
  },
  {
    id: 6,
    questionText: 'Q6. サーバーとして構築・運用経験のあるOSを全て選択してください。',
    answers: [
      { label: 'Linux (RHEL/CentOS系)' },
      { label: 'Linux (Ubuntu/Debian系)' },
      { label: 'Windows Server' },
    ],
  },
  {
    id: 7,
    questionText:
      'Q7. 主な業務で利用したことのあるクラウドプラットフォームを全て選択してください。',
    answers: [
      { label: 'AWS (Amazon Web Services)' },
      { label: 'Microsoft Azure' },
      { label: 'GCP (Google Cloud Platform)' },
    ],
  },
  {
    id: 8,
    questionText: 'Q8. 実務で使用経験のある仮想化・コンテナ技術を全て選択してください。',
    answers: [{ label: 'VMware vSphere' }, { label: 'Docker' }, { label: 'Kubernetes' }],
  },
  {
    id: 9,
    questionText: 'Q9. 実務で使用経験のある構成管理・自動化ツールを全て選択してください。',
    answers: [
      { label: 'Ansible' },
      { label: 'Terraform' },
      { label: 'シェルスクリプト (Bashなど)' },
    ],
  },
  {
    id: 10,
    questionText:
      'Q10. 実務で設定・運用経験のあるネットワーク機器や監視ツールを全て選択してください。',
    answers: [
      { label: 'L2/L3スイッチ (Ciscoなど)' },
      { label: 'ルーター' },
      { label: 'ファイアウォール' },
      { label: 'ロードバランサー' },
      { label: 'Zabbix' },
      { label: 'Prometheus / Grafana' },
      { label: 'Datadog' },
    ],
  },
];
