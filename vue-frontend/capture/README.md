# README 用操作動画の撮影

リポジトリ直下の README に掲載する操作動画（アニメーション WebP）を、Playwright で本番環境を操作して作る。
画面は Chromium のスクリーンキャスト機能で無劣化の PNG として取り込み、可逆圧縮の WebP（表示幅 720px）にまとめる。

## 前提

- WSL に ffmpeg（libwebp 対応）が入っていること
  - 導入: `sudo apt update && sudo apt install -y ffmpeg`
  - 確認: `ffmpeg -hide_banner -encoders | grep libwebp_anim` で1行以上表示される
- e2e と同じく Playwright の Chromium が入っていること
- `origin`（GitHub）へ push できること

## 手順

`vue-frontend` で順に実行する。

```bash
npm run capture          # 本番環境を操作して画面を取り込む
npm run capture:convert  # 取り込んだ画像を WebP に変換する
npm run capture:publish  # WebP を media ブランチに公開する（確認あり）
```

1. `capture` は、暖機（取り込みなし）のあと、ライト・ダークの両テーマで各フローの画面を取り込む。
2. `capture:convert` は、各ファイルの取り込み枚数とサイズを表示する。5MB を超えたものがあると失敗で終わる。
3. `capture:publish` は、公開前にファイル一覧を表示して確認を求める。`y` で media ブランチを作り直して強制 push する。
4. 公開後に表示される URL は毎回同じ。README の書き換えは不要で、最大5分で新しい内容に置き換わる。

## 構成

| ファイル | 役割 |
| --- | --- |
| `00-warmup.spec.ts` | 本番のバックエンドと PDF 生成をコールドスタートから起こす |
| `01-survey-flow.spec.ts` | カテゴリ選択から結果表示まで |
| `02-share-flow.spec.ts` | 名前入力から PDF ダウンロードの活性化まで（再生時は2倍速） |
| `helpers.ts` | 画面の取り込み、疑似カーソル、操作、データ投入 |
| `convert.mjs` | 取り込み画像 → WebP 変換 |
| `publish.mjs` | media ブランチへの公開 |
| `output/` | 取り込み画像・変換結果（コミットしない） |

- 実行順（暖機 → ライト/ダーク）とテーマは `../playwright.capture.config.ts` のプロジェクトで決めている。
- 出力名は `<フロー名>-<テーマ>`（例: 取り込み画像は `output/survey-flow-dark/`、変換結果は `output/survey-flow-dark.webp`）。
- 取り込みは画面の描画が済んでから始めるため、空白ページや読み込み中の画面は含まれない。
- 画像は画面が変化したときだけ届く。各画像の時刻（`frames.json`）から表示時間を決めて変換する。

## 公開方式の背景

- 作業ブランチにコミットすると、更新のたびに古いファイルが履歴に残りリポジトリが肥大化する。
- GitHub のコメント添付は、ログインしていない閲覧者に表示されなかった。
- そのため、メディアだけを持つ media ブランチを毎回1コミットで作り直し、`raw.githubusercontent.com` から参照する。
- media ブランチには `vue-frontend/vercel.json`（自動デプロイ無効）も入れる。Vercel は push されたコミットの Root Directory（`vue-frontend`）から設定を読むため、これがないと media ブランチへの push でプレビューデプロイが走って失敗する。Vercel の Root Directory を変えた場合は `publish.mjs` の `VERCEL_CONFIG_PATH` も合わせる。
- GIF は容量が大きく、動画（MP4）は README で自動再生されずテーマ切り替えもできないため、アニメーション WebP を使う。

## 画質設定の背景

- Playwright の動画録画は録画中に圧縮されるため、スクロール時に文字の欠けやブロックノイズが出た。そのためスクリーンキャストで無劣化の画像を取り込む。スクリーンキャストは動画録画と同じ仕組みのため、両方を同時には使えない（設定で録画を無効にしている）。
- 非可逆の WebP は、文字や枠線の周りにブロックノイズが残り、ダークテーマで目立った。可逆圧縮にするとノイズはなくなる。
- 表示幅は、GitHub の本文幅に対して 800px では大きすぎたため 720px にした。
- 2倍の解像度で出力すると文字はくっきりするが、可逆では 7MB 前後になり目安を超えるため、表示幅と同じ解像度（等倍）で出力する。取り込み自体は2倍の表示倍率で行い、変換時に縮小する。

## 注意

- 撮影のたびに本番 DB に「山田太郎」のシートが作られる（暖機1件、各テーマ1件）。有効期限で自動削除される。
- 暖機で PDF 生成に失敗した場合は、本番のバックエンドや PDF 生成の状態を確認する。
- 操作のテンポは `helpers.ts` の `slowHover` / `slowClick` と各 spec の `waitForTimeout` で調整する。
- 表示幅を変える場合は、`convert.mjs` の `OUTPUT_WIDTH` とリポジトリ直下の README の `width` を揃える。
