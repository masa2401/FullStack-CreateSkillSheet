# スキルシート作成ページ（バックエンド拡張版）

&nbsp;

[サイトはこちら](https://full-stack-create-skill-sheet.vercel.app/#/)

実装済：IDでのURL共有機能  
実装予定：期限付きURL作成、PDFを出力API、集計機能、WebHook追加機能

&nbsp;

## 概要

就職活動や社内の技術レベルの把握に使う目的で

フロントエンド (Vue + TypeScript)  
バックエンド (SpringBoot / Java)

の構成で制作したスキルシート作成アプリです。  
フロントエンドで製作したものに対し、機能拡張を行うためバックエンドと接続しています。

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

フロントエンドとバックエンドの型を合わせる事が大変でした。  
というのも、はじめフロントエンドのオブジェクトのプロパティに状態管理を割り当てていたこともあり、それを分離しつつバックエンドとつなぐ必要があったため、型の変換などの過程を取らなくてはいけなくなり大変でした。

また、はじめの記述ではDBに対して多重送信を行うことが出来てしまい、そちらの修正作業もかなり苦労しました。現在ではAPI通信は初回の一度のみになり、DBの重複保存もなくなっています。
