# スキルシート作成ページ（フルスタック版）

&nbsp;

[【 サイトはこちら 】](https://full-stack-create-skill-sheet.vercel.app/#/)

実装済：IDでのURL共有機能、期限付共有URL化  
実装予定：PDF出力API、集計機能、WebHook追加機能

&nbsp;

## 概要

本アプリは、就職活動における自己PRや、社内メンバーの技術レベルを効率的に把握・管理することを目的としたスキルシート作成ツールです。
元々フロントエンド（Vue3 + TypeScript）で制作したシステムに対し、実務運用を想定した機能拡張を行うため、バックエンド（Spring Boot）およびデータベースを接続してフルスタックな構成へと刷新しました。

[【 旧開発リポジトリ（フロントエンド） 】](https://github.com/masa2401/CreateYourSkillSheet)

## デプロイ・開発フロー図

```mermaid
graph TD
    Developer[開発者]

    subgraph LambdaDeploy [AWS Lambdaのデプロイ]
        LocalDocker[ローカル Docker]
        ECR[Amazon ECR]
        Lambda[AWS Lambda]
    end

    subgraph AppDeploy [フロント/バックエンドのCIとCD]
        GitHub[GitHub]
        GHATest[GitHub Actions<br>自動テスト]
        GHADeploy[GitHub Actions<br>ビルド/デプロイ]
        GHCR[GitHub Container Registry]
        Railway[Railway]
    end

    %% アプリ本体のデプロイフロー
    Developer -->|PR作成とMainマージ| GitHub
    GitHub -->|フロント・バックエンドテスト| GHATest
    GHATest -->|テスト成功でデプロイ処理起動| GHADeploy
    GHADeploy -->|DockerイメージPush| GHCR
    GHADeploy -->|Railway CLIでデプロイ実行| Railway
    GHCR -.->|イメージ参照| Railway

    %% AWS Lambdaのデプロイフロー
    Developer -->|AWS用コンテナビルド| LocalDocker
    LocalDocker -->|AWS CLIでPush| ECR
    ECR -->|イメージ適用| Lambda

    %% スタイルの設定
    style Developer fill:#4A154B,stroke:#333,stroke-width:2px,color:#fff
    style Lambda fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style ECR fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style GHCR fill:#24292e,stroke:#333,stroke-width:2px,color:#fff
```

## PDF化機能システム構成図（アーキテクチャ）

```mermaid
graph TD
    User[ユーザー]
    Vercel[Vercel フロント]
    Railway[Railway バックエンド]
    DB[(PostgreSQL)]
    Lambda[AWS Lambda Puppeteer]
    S3[(Amazon S3)]

    User -->|1. PDF生成リクエスト| Vercel
    Vercel -->|2. 生成要求とポーリング開始| Railway
    Railway -.->|3. 既存のUUIDデータを参照| DB
    Railway -->|4. 共有URLを渡し非同期実行| Lambda
    Lambda -->|5. 共有ページを読込しPDF化| S3
    Railway -->|6. ポーリングでS3の生成完了を確認| S3
    Railway -->|7. 完了通知とDL用URLを返却| Vercel
    Vercel -->|8. DLボタンを活性化| User

    %% スタイルの設定
    style User fill:#005A9C,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#E49313,stroke:#333,stroke-width:2px,color:#fff
    style Lambda fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style S3 fill:#569A31,stroke:#333,stroke-width:2px,color:#fff
```

## 本アプリのこだわり（実務・運用を意識した取り組み）

- **フロントエンドの疎結合設計と保守性の向上**  
  将来的な仕様変更や機能拡張にも対応できるよう、関数の切り出しやコンポーネントの疎結合化を行い、コードの可読性を高めたり、修正作業の影響範囲を最小限に抑える設計を意識しました。

- **TypeScript導入による、スムーズなAPI連携**  
  フロントエンドに型定義を導入し、バックエンドとのデータ構造の不整合を未然に防ぐことができ、API連携の時に修正作業を最小限にすることが出来ました。

- **CI/CDの構築と自動テスト**  
  コード品質を保つため、フロント・バックエンド両方に自動テスト（Vitest / JUnit等）を導入しました。モックを活用したコンポーネントの動作確認や、関数の正常・異常系チェックといった単体テストをGitHub Actionsで自動実行する環境を構築しました。

- **デプロイ最適化とコスト削減**  
  インフラにはVercel（フロント）とRailway（バックエンド）を採用。初期はRailway側で毎回Buildを行っていたため、メモリ消費量が大きかったのですが、GitHub Actions側でDockerコンテナをBuild/Pushし、デプロイ先ではコンテナの展開のみを行う構成へと変更。メモリ消費を抑えた効率的なインフラ運用（コスト削減）を実現しました。

- **GitHub Projectsを活用したプロジェクト管理**  
  実務におけるチーム開発やタスク管理の流れを意識し、GitHub Projectsを用いてIssueを管理することで、アジャイル開発の流れを開発に取り入れています。

### 使用技術

#### フロントエンド

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Vitest](https://img.shields.io/badge/Vitest-7EA93D?style=for-the-badge&logo=vitest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=white)

#### バックエンド

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Maven](https://img.shields.io/badge/Apache_Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Flyway](https://img.shields.io/badge/Flyway-CC292B?style=for-the-badge&logo=flyway&logoColor=white)

#### インフラ / その他

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)

## ディレクトリ構造

```text
root/
├── spring-backend/      # バックエンド（Spring Boot）
│   └── src/
│       ├── main/
│       │   └── java/com/skillsheet/
│       │       ├── config/                      # 各種設定クラス
│       │       ├── controller/                  # APIエンドポイント
│       │       ├── dto/                         # データ転送オブジェクト
│       │       ├── entity/                      # DBテーブル連携用クラス
│       │       ├── exception/                   # 例外処理
│       │       ├── repository/                  # DBアクセス機能
│       │       ├── service/                     # ビジネスロジック
│       │       └── SkillSheetApplication.java   # 起動クラス
│       └── test/                                # テストコード
├── vue-frontend/                                # フロントエンド
└── README.md                                    # 本ファイル
```

## 機能詳細、苦労した部分

### IDによるURL共有機能

- #### フロント・バックエンド間のデータ構造の変換

  フロントエンドの状態管理（Pinia等）に依存するオブジェクト構造と、バックエンドが要求するAPIのデータ構造（DTO）を分離・変換する処理の構築に工夫が必要でした。
  フロント側できちんと型を定義し、API通信専用のインターフェースへ変換する層を設けたことで、スムーズなAPI連携を実現することができました。

- #### 二重送信（多重送信）の防止と不整合データの排除

  初期の実装では、ボタンの連打等によってDBに対して同一データの多重送信が発生してしまう問題がありました。
  対策として、フロントエンド側でAPI通信の制御（状態管理や初回送信のみの制限）を行うようロジックを修正。不要な通信をカットしつつ、DBへの重複保存のバグを解消することが出来ました。

- #### UUID採用による他者データの閲覧・推測防止

  初期の個人利用を想定したフェーズから、社内利用レベルへのスケールを見据え、共有URLのセキュリティ向上を意識しました。
  連番のID（1, 2, 3...）ではなく、不規則かつ膨大な組み合わせを持つ『UUID』を採用。IDを書き換えるだけで他人のデータにアクセスできてしまうリスクを排除し、安全に共有出来るようになりました。

### 期限付き共有URL化とライフサイクル管理

- #### ステータスコード（410/404）によるエラーハンドリング

  共有URLに対して、期限切れ直後とDB削除後でフロントエンドの表示を切り替える工夫をしました。
  バックエンド側で LocalDateTime.now() を用いて比較し、期限切れ直後は 410(Gone) を返却してUI側に「期限切れ」を通知し、DB自動削除後は 404(Not Found) になるよう制御することで、データの状態に応じたUIを実現しました。

- #### @Scheduledを活用した不要データの自動クリーンアップ

  実務運用において、不要なデータがDBに残り続けることは、ストレージの圧迫やインフラコストの増大に繋がるため、@Scheduledを利用した定期的な自動削除機能を実装しました。指定した時間（Cron）でバックエンドが非同期にクリーンアップ処理を実行することで、実務を意識したリソース管理とデータのライフサイクル設計を取り入れることができました。

## 今後の展望（ロードマップ）

追加機能の一部をAWS Lambda等へ切り出し、外部APIとしてサーバーレスアーキテクチャ化を計画中。サーバーレス運用を通じた、モダンなバックエンド設計の学習を目標としています。

```mermaid

graph TD
    User[ユーザー]
    Vercel[Vercel フロント]
    Railway[Railway <br>バックエンド]
    DB[(PostgreSQL)]
    Lambda[AWS Lambda Puppeteer]
    S3[(Amazon S3)]

    User -->|1. PDF生成リクエスト| Vercel
    Vercel -->|2. 生成要求とポーリング開始| Railway
    Railway -.->|3. 既存のUUIDデータを参照| DB
    Railway -->|4. 共有URLを渡し非同期実行| Lambda
    Lambda -->|5. 共有ページを読込しPDF化| S3
    Railway -->|6. ポーリングでS3の生成完了を確認| S3
    Railway -->|7. 完了通知とDL用URLを返却| Vercel
    Vercel -->|8. DLボタンを活性化| User

    %% スタイルの設定
    style User fill:#005A9C,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#E49313,stroke:#333,stroke-width:2px,color:#fff
    style Lambda fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style S3 fill:#569A31,stroke:#333,stroke-width:2px,color:#fff
```

```mermaid
graph TD
    Developer[開発者 ローカル]

    subgraph AppDeploy [WebとバックエンドのCIとCD]
        GitHub[GitHub]
        GHATest[GHA 自動テスト]
        GHADeploy[GHA ビルドとデプロイ]
        GHCR[GitHub Container Registry]
        Railway[Railway]
    end

    subgraph LambdaDeploy [AWS Lambdaのデプロイ]
        LocalDocker[ローカル Docker]
        ECR[Amazon ECR]
        Lambda[AWS Lambda]
    end

    %% アプリ本体のデプロイフロー
    Developer -->|PR作成とMainマージ| GitHub
    GitHub -->|フロント・バックエンドテスト| GHATest
    GHATest -->|テスト成功でデプロイ処理起動| GHADeploy
    GHADeploy -->|DockerイメージPush| GHCR
    GHADeploy -->|Railway CLIでデプロイ実行| Railway
    GHCR -.->|イメージ参照| Railway

    %% AWS Lambdaのデプロイフロー
    Developer -->|Puppeteerコンテナビルド| LocalDocker
    LocalDocker -->|AWS CLIでPush| ECR
    ECR -->|イメージ適用| Lambda

    %% スタイルの設定
    style Developer fill:#4A154B,stroke:#333,stroke-width:2px,color:#fff
    style Lambda fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style ECR fill:#FF9900,stroke:#333,stroke-width:2px,color:#fff
    style GHCR fill:#24292e,stroke:#333,stroke-width:2px,color:#fff
```
