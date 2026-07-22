import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import puppeteer, { type Browser } from 'puppeteer';

// ─── 型定義 ──────────────────────────────────────────────────────

/** バックエンドから受け取るリクエストの形 */
interface PdfGenerationRequest {
  id: string;
  url: string;
  fileName?: string;
}

/** バックエンドへ返すレスポンスの形 */
interface PdfGenerationResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}

// ─── 環境変数 ────────────────────────────────────────────────────

const BUCKET_NAME = process.env.PDF_BUCKET_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const PRESIGNED_URL_EXPIRES_SECONDS = Number(
  process.env.PRESIGNED_URL_EXPIRES_SECONDS ?? 600,
);

const s3 = new S3Client({});

let browserPromise: Promise<Browser> | undefined;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
      ],
    });
  }
  return browserPromise;
}

/**
 * 渡されたURLが許可オリジン配下かを検証する（SSRF対策の多重防御）。
 * 検証を通過した正規化済みURL文字列を返す。
 */
function assertAllowedUrl(rawUrl: string): string {
  if (!ALLOWED_ORIGIN) {
    throw new Error('環境変数 ALLOWED_ORIGIN が設定されていません');
  }
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    throw new Error('url が不正な形式です');
  }
  const allowed = new URL(ALLOWED_ORIGIN);
  if (target.origin !== allowed.origin) {
    throw new Error(`許可されていないオリジンです: ${target.origin}`);
  }
  return target.toString();
}

/**
 * ファイル名として安全な文字列に変換する（S3のContent-Disposition用）。
 */
function sanitizeFileName(name: string | undefined): string {
  if (!name) return 'skillsheet';
  return name.replace(/[^\w\-ぁ-んァ-ヶ一-龠々ー]/g, '_').slice(0, 50);
}

// シンプルなUUID形式チェック（S3キーとして安全に使うための最低限のバリデーション）
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const handler = async (
  event: PdfGenerationRequest,
): Promise<PdfGenerationResponse> => {
  const { id, url, fileName } = event ?? {};

  if (!id || !UUID_PATTERN.test(id)) {
    throw new Error('リクエストに有効な ID が含まれていません');
  }
  if (!url || typeof url !== 'string') {
    throw new Error('リクエストに URL が含まれていません');
  }
  if (!BUCKET_NAME) {
    throw new Error('環境変数 PDF_BUCKET_NAME が設定されていません');
  }

  const targetUrl = assertAllowedUrl(url);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 結果ページへ遷移し、データ取得（バックエンドAPI呼び出し）を含めて描画が終わるまで待つ
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    // ローディング状態のまま描画されていないかを確認する簡易ガード
    await page.waitForSelector('.page-container', { timeout: 10000 });

    // 印刷用CSS（@media print）を適用させる
    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
    });

    const objectKey = `skill-sheets/${id}.pdf`;
    const safeFileName = sanitizeFileName(fileName);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: `attachment; filename="${encodeURIComponent(safeFileName)}.pdf"`,
      }),
    );

    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: objectKey }),
      { expiresIn: PRESIGNED_URL_EXPIRES_SECONDS },
    );

    return {
      downloadUrl,
      expiresInSeconds: PRESIGNED_URL_EXPIRES_SECONDS,
    };
  } finally {
    await page.close();
  }
};
