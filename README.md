# スキルシート作成ページ（バックエンド拡張版）

&nbsp;

[サイトはこちら](https://masa2401.github.io/CreateYourSkillSheet/#/)  
(こちらのURLにアクセスいただくと、そのまま利用できます）

&nbsp;

## 概要

就職活動や社内の技術レベルの把握に使う目的で  
フロントエンド (Vue + TypeScript)  
バックエンド (SpringBoot / Java)  
の構成で制作したスキルシート作成アプリです。

フロントエンドで製作したものに対し、機能拡張を行うためバックエンドと  
接続しています。実装（予定）の機能としては、URL

### 使用技術

- Framework: Spring Boot 4.0.6
- Language: Java 21
- Build Tool: Maven
- Database: H2 Database (In-Memory)
- ORM: Spring Data JPA (Hibernate)
- Other Tools: Lombok

&nbsp;

## ディレクトリ構造

```text
root/
├── src/                # ソースコード
│   ├── assets/         # 共通CSSと画像
│   ├── components/     # UIコンポーネント
│   ├── composable/     # Validation機能
│   ├── data/           # 質問データ
│   ├── router/         # Vue router
│   ├── stores/         # 状態管理(Pinia)
│   ├── test/           # テスト用データ
│   ├── types/          # 型データ
│   ├── utils/          # 共通関数
│   └── views/          # 見た目データ
├── App.vue
├── main.ts
├── package.json
└── README.md           # 本ファイル
```
