import type { Question } from '@/types'

export const engineerQuestions: Question[] = [
  {
    id: 1,
    title: 'フロントエンド言語',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'HTML' },
      { id: 2, label: 'CSS' },
      { id: 3, label: 'Sass/SCSS' },
      { id: 4, label: 'JavaScript' },
      { id: 5, label: 'TypeScript' },
    ],
  },
  {
    id: 2,
    title: 'バックエンド言語',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'PHP' },
      { id: 2, label: 'Ruby' },
      { id: 3, label: 'Python' },
      { id: 4, label: 'Java' },
      { id: 5, label: 'Go' },
    ],
  },
  {
    id: 3,
    title: 'フレームワーク・ライブラリ',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'React' },
      { id: 2, label: 'Vue.js' },
      { id: 3, label: 'Angular' },
      { id: 4, label: 'jQuery' },
      { id: 5, label: 'Laravel(PHP)' },
      { id: 6, label: 'Ruby on Rails(Ruby)' },
      { id: 7, label: 'Django(Python)' },
      { id: 8, label: 'SpringBoot(Java)' },
    ],
  },
  {
    id: 4,
    title: 'データベース',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'MySQL / MariaDB' },
      { id: 2, label: 'PostgreSQL' },
      { id: 3, label: 'Oracle Database' },
      { id: 4, label: 'MongoDB' },
      { id: 5, label: 'Redis' },
    ],
  },
  {
    id: 5,
    title: 'バージョン管理ツール',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'Git / GitHub / GitLab' },
      { id: 2, label: 'Subversion (SVN)' },
      { id: 3, label: 'Mercurial' },
      { id: 4, label: 'Perforce' },
    ],
  },
  {
    id: 6,
    title: 'サーバーOS',
    prompt: '構築・運用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'Linux (RHEL/CentOS系)' },
      { id: 2, label: 'Linux (Ubuntu/Debian系)' },
      { id: 3, label: 'Windows Server' },
    ],
  },
  {
    id: 7,
    title: 'クラウドプラットフォーム',
    prompt: '主な業務で利用したことのあるものを選択してください。',
    answers: [
      { id: 1, label: 'AWS (Amazon Web Services)' },
      { id: 2, label: 'Microsoft Azure' },
      { id: 3, label: 'GCP (Google Cloud Platform)' },
    ],
  },
  {
    id: 8,
    title: '仮想化・コンテナ技術',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'VMware vSphere' },
      { id: 2, label: 'Docker' },
      { id: 3, label: 'Kubernetes' },
    ],
  },
  {
    id: 9,
    title: '構成管理・自動化ツール',
    prompt: '実務で使用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'Ansible' },
      { id: 2, label: 'Terraform' },
      { id: 3, label: 'シェルスクリプト (Bashなど)' },
    ],
  },
  {
    id: 10,
    title: 'ネットワーク機器・監視ツール',
    prompt: '実務で設定・運用経験のあるものを選択してください。',
    answers: [
      { id: 1, label: 'L2/L3スイッチ (Ciscoなど)' },
      { id: 2, label: 'ルーター' },
      { id: 3, label: 'ファイアウォール' },
      { id: 4, label: 'ロードバランサー' },
      { id: 5, label: 'Zabbix' },
      { id: 6, label: 'Prometheus / Grafana' },
      { id: 7, label: 'Datadog' },
    ],
  },
]
