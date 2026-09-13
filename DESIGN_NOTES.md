# 設計ノート

[スキルシート作成ページ（フルスタック版）](./README.md)の実装で行った設計判断と、その背景をまとめた文書です。\
機能の使い方ではなく、「なぜその実装を選んだか」を扱います。

## 状態に応じた段階的な機能制限

### aria-disabled によるアクセシブルな操作誘導

名前が未入力のゲスト状態でも、結果画面そのものの閲覧は許可する方針を取りました。\
一方で、共有・印刷のようにサーバー側のデータと紐づく操作は、名前が確定するまで実行できません。

この「見えるが押せない」状態を native の `disabled` 属性で表現すると、問題が起きます。\
`disabled` が付いた要素はブラウザがポインタイベントを配送しないため、\
hover も focus も発生せず、**なぜ押せないのかをツールチップで説明する手段が無くなります**。

採用したのは `aria-disabled` による無効化です。\
`src/components/AppButton.vue` が `inactive` プロパティを受け取り、属性とスタイルの両方を制御します。

```vue
:aria-disabled="inactive"
```

```
aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:shadow-none
```

要素自体は有効なままなので、hover と focus が通常どおり発生します。\
`src/components/ShareButton.vue` はゲスト状態のときだけボタンを `Tooltip` で包み、\
`src/composables/useGuestGate.ts` が公開する `GUEST_HINT_MESSAGE` を表示します。

実際の操作制御は同じコンポーザブルの `guard()` が担当します。\
ゲスト状態なら本来の処理を実行せず、名前入力欄へフォーカスを移してページ先頭へスクロールします。

```ts
const guard = (action: () => void): void => {
  if (isGuest.value) {
    goToNameInput();
    return;
  }
  action();
};
```

押せない理由の提示（ツールチップ）と、次の行動の提示（フォーカス移動）が分かれているため、\
ポインタ操作でもキーボード操作でも同じ導線が成立します。

## Lambda のコールドスタートを見越したプリフェッチ設計

### 名前確定をトリガーにした先行保存

PDF 化は AWS Lambda 上の Puppeteer で生成しています。\
コンテナイメージを使う都合でコールドスタートが発生し、実測で 16 秒前後かかります。\
ユーザーが共有メニューを開いてから保存を始めると、この待ち時間がそのまま体感の遅さになります。

Provisioned Concurrency による常時起動も選択肢でしたが、\
アクセス頻度の低いアプリケーションに対して常時課金が発生するため見送りました。

代わりに、**保存処理そのものを前倒しする**方針を取りました。\
結果ページで名前の入力が確定したタイミングで、シートの保存を先行実行します。\
該当するのは `src/views/ResultPage.vue` の `handleNameCommitted` です。

保存 API は `SkillSheetService.save()` の中で、保存成功後に Lambda を非同期 Invoke します。\
つまりシートを保存した時点で PDF の生成が始まります。\
ユーザーが結果を読んでいる時間が、そのままコールドスタートの待ち時間に充てられる構造です。

二重保存を避けるため、`src/stores/useSurveyStore.ts` の `getSavedIdOrSave()` が入口を一本化しています。

- 保存済みで、かつ現在の回答内容がスナップショットと一致する場合は、既存の ID をそのまま返す
- ID の実在をまだ確認していない場合のみ、バックエンドへ存在確認を投げる
- それ以外は新規に保存する
  共有メニューを開く `src/components/ShareButton.vue` の `openMenu()` も同じ関数を呼びます。\
  プリフェッチが成功していれば、この呼び出しは保存を伴わず既存 ID を返すだけで完了します。\
  **プリフェッチはあくまで最適化であり、ボタン操作からの経路だけでも機能は完結します。**

## テストと CI による品質向上

### アクセシビリティを軸にしたテスト設計

CSS クラス名に依存したテストは、見た目のリファクタのたびに壊れます。\
実際、shadcn-vue への移行ではクラス構成が大きく変わりました。

テストの検証軸を、表示テキスト・`role`・アクセシブル名・\
ネイティブ要素の状態・`data-*` 属性に統一しています。\
現在、ユニットテストに `toHaveClass` と `.classes()` は一つも残っていません。

状態を属性で表す必要がある場合は、専用の属性を切ります。\
`src/components/MenuItemButton.vue` はフィードバック状態を `data-feedback` で持ち、\
Tailwind のデータ属性バリアントで見た目を切り替えます。\
shadcn 側が使う `data-variant` と衝突させないための命名です。

### Vitest と Playwright の使い分け

すべてを Vitest（jsdom）で書こうとすると、\
CSS の `:has()` セレクタ、Clipboard API、`localStorage` の永続化、印刷用スタイル、\
Reka UI の Portal 経由の描画といった、実ブラウザでしか発生しない挙動を検証できません。\
しかし全部を Playwright に寄せると、多分岐のロジックや\
emit されたペイロードの値レベルの検証が難しくなり、実行コストも膨らみます。

**Vitest はロジック、Playwright は見た目と実挙動**という線で分けています。\
Reka UI の実際の開閉、Portal の描画位置、印刷レイアウトの退行は e2e の担当と決めていて、\
jsdom 上で再現しようとはしません。

### 状態の直接注入による E2E 実行コストの最適化

CSV ダウンロードや印刷スタイルのように「特定の画面状態」だけを確かめたいテストでも、\
トップ画面からクリック操作で状態を作ると、実行時間と可読性の両方を損ないます。

`pinia-plugin-persistedstate` が書き出す構造を調査し、\
`addInitScript` で `localStorage` に直接状態を書き込んでから、対象ページへ遷移します。\
この仕組みは `e2e/pages/ResultPage.ts` に用意しました。\
ページ遷移そのものを検証するテストだけは、実際の UI 操作を維持しています。

## AWS Lambda + Puppeteer による非同期 PDF 生成

### 非同期 Invoke とポーリングによる完了検知

Lambda は `InvocationType.EVENT` で呼び出しています（`LambdaPdfService`）。\
非同期 Invoke なので、呼び出し元が受け取れるのは「呼び出しを受理した」という 202 だけで、\
**PDF 生成の成否は戻り値から分かりません**。

Webhook による完了通知も検討しましたが、\
SNS や SQS といったインフラの追加が必要になり、構成が重くなります。

採用したのは、**S3 にオブジェクトが存在することを完了とみなす**方式です。\
`PdfController` の `GET /api/pdf/{id}/status` が `headObject` を 1 回実行し、\
存在すれば有効期限 10 分の署名付き URL を、無ければ生成中を返します。

ポーリングのループを回すのはフロントエンド側の `src/composables/usePdfStatus.ts` です。\
バックエンドは 1 リクエストにつき 1 回だけ S3 を確認する、\
状態を持たないエンドポイントに留めています。

待ち時間の扱いは次の定数で制御しています。

| 定数                | 既定値 | 役割                                                     |
| ------------------- | ------ | -------------------------------------------------------- |
| `INITIAL_DELAY_MS`  | 10 秒  | 初回ポーリングまでの待機（コールドスタートを見込む）     |
| `FAST_INTERVAL_MS`  | 3 秒   | 生成中のポーリング間隔                                   |
| `SLOW_THRESHOLD_MS` | 40 秒  | これを超えたら表示を「時間がかかっています」へ切り替える |
| `TIMEOUT_MS`        | 120 秒 | 打ち切り                                                 |

生成の進捗率は取得できないため、進捗バーは `SLOW_THRESHOLD_MS` を 100% とした\
経過時間ベースの目安として扱っています。

### 描画完了を判定する契約属性

Lambda はフロントエンドの共有ページを実際にブラウザで開いて PDF 化します。\
このとき「ページの描画がどこまで進んだら PDF にしてよいか」を判定する必要があります。

レイアウト都合のクラス名や DOM 構造を判定に使うと、\
フロントエンドのリファクタで PDF 生成が静かに壊れます。\
そこで **判定用の属性を 2 つだけ決め、それ以外には依存させない** 契約にしました。

- `data-pdf-ready` … `src/views/ResultPage.vue` のシートルート。ページが `ready` のときだけ出力される
- `data-pdf-error` … 同ファイルのエラーパネル。期限切れや未存在で表示される
  Lambda 側は両方を待ち、エラー側が出ていれば PDF を作らずに失敗させます。

```ts
await page.waitForSelector("[data-pdf-ready], [data-pdf-error]", {
  timeout: 10000,
});

if ((await page.$("[data-pdf-error]")) !== null) {
  throw new Error(
    `シートを描画できませんでした（期限切れ／未存在の可能性）: id=${id}`,
  );
}
```

**この 2 つの属性は排他です。**\
同時に出ると Lambda が不正な PDF を生成してしまうため、\
`e2e/share.spec.ts` に両属性の出現と排他性を検証するテストを置いています。

属性名を変える場合は `aws-lambda/src/index.ts` も同時に変更する必要があり、\
双方のコードにその旨のコメントを残しています。

PDF はライトモード固定です。\
`emulateMediaFeatures` によるカラースキームの指定は、`goto` の**前**に実行します。\
`index.html` に置いた FOUC 対策スクリプトより後では間に合わないためです。

### Puppeteer のコンテナ化とデプロイ

Lambda 上で Puppeteer を安定動作させるには、依存ライブラリを含めた環境構築が必要です。\
特に日本語フォントは、軽量ランタイム（`@sparticuz/chromium`）では\
システムの fontconfig が反映されず、表示が崩れました。

軽量ランタイム側でフォントを埋め込む対応も試しましたが、安定した日本語表示を優先し、\
フル版の Puppeteer（Chrome for Testing）を Docker でコンテナ化する方針に切り替えました。

デプロイは当初、ローカルでイメージをビルドして Amazon ECR へ push し、\
Lambda へ手動で適用していました。\
現在は GitHub Actions から OIDC で AWS へ認証し、\
ECR へ push した上で `update-function-code` で適用する流れに自動化しています。\
サーバーレスの運用を手作業で一通り理解したうえで、CI/CD に載せ替えた形です。

自動化にあたっては、`docker/build-push-action` の `provenance` と `sbom` を\
明示的に無効化する必要がありました。\
buildx は既定で attestation を付与し、\
その結果イメージが OCI Image Index（Manifest List）になります。\
**Lambda は Manifest List を受け付けません。**\
同じ理由の制約は GHCR → Railway 側には無いため、そちらは OCI のままにしています。

## その他の設計判断（バックエンド／インフラ）

- **UUID による共有 ID** … 連番 ID は他人のシートを推測できてしまうため、予測不可能な UUID を使用
- **共有 URL のライフサイクル管理** … 期限切れは 410、削除後は 404 とステータスコードで区別し\
  （`GlobalExceptionHandler`）、`@Scheduled` で期限切れデータを定期削除
- **保存 API のレート制限** … 同一クライアントからの短時間の連投を `SaveRateLimiter` で抑制し、\
  429 と `Retry-After` を返す
- **既存の共有画面を活用した PDF 生成** … PDF 専用の描画ロジックを別に作らず、\
  共有ページをそのまま Puppeteer で開く。実装コストと、画面と PDF の表示の一貫性を両立
- **CI/CD のビルド最適化** … コンテナのビルドを GitHub Actions 側で行い、デプロイ先の負荷を軽減
