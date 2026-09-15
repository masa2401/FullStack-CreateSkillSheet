# スキルシート作成ページ（フルスタック版）

&nbsp;

[【 サイトはこちら 】](https://full-stack-create-skill-sheet.vercel.app/#/)

&nbsp;

## 概要

本アプリは、就職活動における自己PRや、社内メンバーの技術レベルを効率的に把握・管理することを目的としたスキルシート作成ツールです。  
元々フロントエンド（Vue3 + TypeScript）で制作したシステムに対し、実務運用を想定した機能拡張を行うため、\
バックエンド（Spring Boot）およびデータベースを接続してフルスタックな構成へと刷新しました。

[【 旧開発リポジトリ（フロントエンド） 】](https://github.com/masa2401/CreateYourSkillSheet)

## 本アプリで意識したポイント

- ユーザーの操作を止めない、段階的な機能制限とUIによる操作誘導
- ユーザーの入力タイミングを活用した、Lambdaのコールドスタート対策
- VitestとPlaywrightの適材適所での使い分けによるテスト自動化
- フロント・バックエンド間の型安全性を意識したデータ設計
- Lambda上でのPuppeteer実行環境の構築（日本語フォントの文字化け対策など）

## 使用技術

### フロントエンド

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white&style=plastic)
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D&style=plastic)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black&style=plastic)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E&style=plastic)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white&style=plastic)
![shadcn-vue](https://img.shields.io/badge/shadcn--vue-000000?style=for-the-badge&logo=shadcnui&logoColor=white&style=plastic)
![Font Awesome](https://img.shields.io/badge/Font_Awesome-538DD7?style=for-the-badge&logo=fontawesome&logoColor=white&style=plastic)
![Reka UI](https://img.shields.io/badge/Reka_UI-000000?style=for-the-badge&logo=rekaui&logoColor=white&style=plastic)
![Vitest](https://img.shields.io/badge/Vitest-7EA93D?style=for-the-badge&logo=vitest&logoColor=white&style=plastic)
![Testing Library](https://img.shields.io/badge/Testing_Library-E33332?style=for-the-badge&logo=testinglibrary&logoColor=white&style=plastic)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white&style=plastic)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=white&style=plastic)
![Playwright](https://custom-icon-badges.demolab.com/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white&style=plastic)

### バックエンド

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white&style=plastic)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white&style=plastic)
![Maven](https://img.shields.io/badge/Apache_Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white&style=plastic)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white&style=plastic)
![Flyway](https://img.shields.io/badge/Flyway-CC292B?style=for-the-badge&logo=flyway&logoColor=white&style=plastic)

### インフラ / その他

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white&style=plastic)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white&style=plastic)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white&style=plastic)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white&style=plastic)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white&style=plastic)
![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white&style=plastic)
![AWS](https://custom-icon-badges.demolab.com/badge/AWS-232F3E?style=for-the-badge&logo=aws&logoColor=white&style=plastic)
![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white&style=plastic)

## システム構成（アーキテクチャ）図

### デプロイフロー

```mermaid
graph TD
    Merge[mainへマージ]
    Vercel[Vercel<br>フロントエンド]
    Test[GitHub Actions<br>自動テスト]
    Deploy[GitHub Actions<br>ビルド/デプロイ]
    GHCR[GitHub<br>Container Registry]
    Railway[Railway<br>バックエンド]
    ECR[Amazon ECR]
    Lambda[AWS Lambda]

    Merge -->|自動デプロイ| Vercel

    Merge -->|テスト実行| Test
    Test -->|成功時に起動| Deploy

    Deploy -->|イメージPush| GHCR
    Deploy -->|デプロイ実行| Railway
    GHCR -.->|イメージ参照| Railway

    Deploy -->|イメージPush| ECR
    ECR -->|イメージ適用| Lambda

    %% スタイルの設定
    style Merge fill:#4A154B,stroke:#333,stroke-width:2px,color:#fff
    style Vercel fill:#000000,stroke:#333,stroke-width:2px,color:#fff
    style GHCR fill:#24292e,stroke:#333,stroke-width:2px,color:#fff
    style ECR fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style Lambda fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
```

### PDF生成の処理フロー

```mermaid
graph TD
    User[ユーザー]
    Vercel[Vercel<br>フロント]
    Railway[Railway<br>バックエンド]
    DB[(PostgreSQL)]
    Lambda[AWS Lambda]
    S3[(Amazon S3)]

    User -->|1. PDF生成リクエスト| Vercel
    Vercel -->|2. シート保存| Railway
    Railway -.->|3. データ登録| DB
    Railway -->|4. 非同期Invoke| Lambda
    Lambda -->|5. PDF生成| S3
    Railway -.->|6. 生成完了確認| S3
    Railway -->|7. 署名付きURL返却| Vercel
    Vercel -->|8. DLボタン活性化| User

    %% スタイルの設定
    style User fill:#005A9C,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#E49313,stroke:#333,stroke-width:2px,color:#fff
    style Lambda fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style S3 fill:#569A31,stroke:#333,stroke-width:2px,color:#fff
```

## 設計ノート

実装で行った設計判断とその背景は [DESIGN_NOTES.md](./DESIGN_NOTES.md) にまとめています。
