# README 用操作動画の撮影

リポジトリ直下の README に掲載する操作動画（アニメーション WebP）を、Playwright で本番環境を操作して作る。

## 前提

- WSL に ffmpeg（libwebp 対応）が入っていること
  - 導入: `sudo apt update && sudo apt install -y ffmpeg`
  - 確認: `ffmpeg -hide_banner -encoders | grep libwebp_anim` で1行以上表示される
- e2e と同じく Playwright の Chromium が入っていること
- `origin`（GitHub）へ push できること

## 手順

`vue-frontend` で順に実行する。

```bash
npm run capture          # 本番環境を操作して録画する
npm run capture:convert  # 録画を WebP に変換する
npm run capture:publish  # WebP を media ブランチに公開する（確認あり）
```

1. `capture` は、暖機（録画なし）のあと、ライト・ダークの両テーマで各フローを録画する。
2. `capture:convert` は、各ファイルのサイズを表示する。5MB を超えたものがあると失敗で終わる。
3. `capture:publish` は、公開前にファイル一覧を表示して確認を求める。`y` で media ブランチを作り直して強制 push する。
4. 公開後に表示される URL は毎回同じ。README の書き換えは不要で、最大5分で新しい内容に置き換わる。

## 構成

| ファイル | 役割 |
| --- | --- |
| `00-warmup.spec.ts` | 本番のバックエンドと PDF 生成をコールドスタートから起こす |
| `01-survey-flow.spec.ts` | カテゴリ選択から結果表示まで |
| `02-share-flow.spec.ts` | 名前入力から PDF ダウンロードの活性化まで（再生時は2倍速） |
| `helpers.ts` | 録画の保存、疑似カーソル、操作、データ投入 |
| `convert.mjs` | 録画 → WebP 変換 |
| `publish.mjs` | media ブランチへの公開 |
| `output/` | 録画・変換結果（コミットしない） |

- 実行順（暖機 → ライト/ダーク）とテーマは `../playwright.capture.config.ts` のプロジェクトで決めている。
- 出力名は `<フロー名>-<テーマ>`（例: `survey-flow-dark.webp`）。
- 冒頭の空白ページは、録画時に記録した切り出し位置（`output/*.json`）をもとに変換時に削る。

## 公開方式の背景

- 作業ブランチにコミットすると、更新のたびに古いファイルが履歴に残りリポジトリが肥大化する。
- GitHub のコメント添付は、ログインしていない閲覧者に表示されなかった。
- そのため、メディアだけを持つ media ブランチを毎回1コミットで作り直し、`raw.githubusercontent.com` から参照する。
- media ブランチには `vue-frontend/vercel.json`（自動デプロイ無効）も入れる。Vercel は push されたコミットの Root Directory（`vue-frontend`）から設定を読むため、これがないと media ブランチへの push でプレビューデプロイが走って失敗する。Vercel の Root Directory を変えた場合は `publish.mjs` の `VERCEL_CONFIG_PATH` も合わせる。
- GIF は容量が大きく、動画（MP4）は README で自動再生されずテーマ切り替えもできないため、アニメーション WebP を使う。

## 注意

- 撮影のたびに本番 DB に「山田太郎」のシートが作られる（暖機1件、各テーマ1件）。有効期限で自動削除される。
- 暖機で PDF 生成に失敗した場合は、本番のバックエンドや PDF 生成の状態を確認する。
- 操作のテンポは `helpers.ts` の `slowHover` / `slowClick` と各 spec の `waitForTimeout` で調整する。
