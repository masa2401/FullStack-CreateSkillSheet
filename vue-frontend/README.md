# スキルシート作成ページ

&nbsp;

[サイトはこちら](https://masa2401.github.io/CreateYourSkillSheet/#/)  
(こちらのURLにアクセスいただくと、そのまま利用できます）

&nbsp;

## 概要

就職活動や社内の技術レベルの把握に使う目的で  
(Vue + TypeScript) の構成で制作したスキルシート作成アプリです。

自身に必要なスキルセットの把握を行っていた時に、スキルシート形式でまとめると楽だと思い、簡単に操作できるものを作りました。
技術的な挑戦と実用性の両面から、メイン機能以外にも共有機能やバリデーション機能の追加、プリントフォーマットの作成などを行いました。

### 使用技術

- FrameWork: Vue 3 (Composition API)
- Language: TypeScript
- BuildTool: Vite
- Linter/Formatter: ESLint, Prettier
- Deployment: GitHub Pages

&nbsp;

## ディレクトリ構造

```text
root/
├── src/                # ソースコード
│   ├── components/     # UIコンポーネント
│   ├── composable/     # Validation機能
│   ├── data/           # 質問データ
│   ├── router/         # Vue router
│   ├── test/           # テスト用データ
│   ├── types/          # 型データ
│   ├── utils/          # 共通関数
│   └── views/          # 見た目データ
├── App.vue
├── main.ts
├── package.json
└── README.md           # 本ファイル
```
