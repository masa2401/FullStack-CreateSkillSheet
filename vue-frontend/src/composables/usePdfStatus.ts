import { fetchPdfStatus, regeneratePdf } from '@/utils/api';
import { onUnmounted, ref, watch, type Ref } from 'vue';

export type PdfGenerationState = 'waiting' | 'generating' | 'ready' | 'error';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_COUNT = 20;

/**
 * シートIDに紐づくPDF生成状態をポーリングするcomposable。
 * sheetIdがセットされる（nullでなくなる）と自動的にポーリングを開始する。
 * AWS Lambda（非同期Invoke）からの明示的な完了通知が無い構成のため、
 * S3オブジェクトの有無を一定間隔で確認する方式を取る。
 */
export function usePdfStatus(sheetId: Ref<string | null>) {
  const state = ref<PdfGenerationState>('waiting');
  const downloadUrl = ref<string>('');

  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let pollCount = 0;

  const stopPolling = () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = undefined;
  };

  const poll = async (id: string) => {
    if (id !== sheetId.value) return;
    try {
      const result = await fetchPdfStatus(id);

      if (id !== sheetId.value) return;

      if (!result) {
        state.value = 'error';
        return;
      }

      if (result.status === 'ready') {
        state.value = 'ready';
        downloadUrl.value = result.downloadUrl;
        return;
      }
      pollCount++;

      if (pollCount >= MAX_POLL_COUNT) {
        state.value = 'error';
        return;
      }
      pollTimer = setTimeout(() => poll(id), POLL_INTERVAL_MS);
    } catch (error) {
      if (id !== sheetId.value) return;

      console.error('PDF状態の取得中にエラーが発生しました:', error);
      state.value = 'error';
      stopPolling();
    }
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollCount = 0;
    state.value = 'generating';
    poll(id);
  };

  /** 「再試行」操作。regenerate APIを叩いてからポーリングを再開する。 */
  const retry = async () => {
    const currentId = sheetId.value;
    if (!currentId) return;
    state.value = 'generating';

    try {
      const ok = await regeneratePdf(currentId);

      // 通信を待っている間にIDが変わったりアンマウントされていたら終了
      if (currentId !== sheetId.value) return;

      if (!ok) {
        state.value = 'error';
        return;
      }
      startPolling(currentId);
    } catch (error) {
      if (currentId !== sheetId.value) return;
      console.error('PDFの再生成に失敗しました:', error);
      state.value = 'error';
    }
  };

  watch(
    sheetId,
    (id) => {
      if (id) {
        startPolling(id);
      } else {
        stopPolling();
        state.value = 'waiting';
      }
    },
    { immediate: true },
  );
  onUnmounted(stopPolling);

  return { state, downloadUrl, retry };
}
