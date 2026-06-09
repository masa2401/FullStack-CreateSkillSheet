# スキルシート作成ページ（バックエンド拡張版）

&nbsp;

[サイトはこちら](https://full-stack-create-skill-sheet.vercel.app/#/)  
(現在フロントエンドのみvercelでデプロイ中。バックエンドは作業中です）

&nbsp;

## 概要

就職活動や社内の技術レベルの把握に使う目的で

フロントエンド (Vue + TypeScript)  
バックエンド (SpringBoot / Java)

の構成で制作したスキルシート作成アプリです。フロントエンドで製作したものに対し、機能拡張を行うためバックエンドと接続しています。

実装（予定）の機能としては、URL共有機能（DBのID管理）、期限付きURL機能、PDF出力API、集計機能、WebHook通知機能などを実装予定です。

### 使用技術

- Framework: Spring Boot 4.0.6
- Language: Java 21
- Build Tool: Maven
- Database: MySQL
- ORM: Spring Data JPA (Hibernate)
- Other Tools: Lombok

&nbsp;

## ディレクトリ構造

```text
root/
├── spring-backend/      # バックエンド（Spring Boot）
│   └── src/
│       ├── main/
│       │   └── java/com/example/skillsheet/
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
