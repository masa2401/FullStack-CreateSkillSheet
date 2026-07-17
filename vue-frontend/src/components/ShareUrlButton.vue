<script setup lang="ts">
import { useSurveyStore } from '@/stores/useSurveyStore';
import { isBackendEnabled } from '@/utils/api';
import { copyToClipboard, createShareUrl } from '@/utils/shareUtils';
import { computed, ref } from 'vue';

const store = useSurveyStore();
const copySuccess = ref<boolean>(false);
const isSaving = ref<boolean>(false);

const emit = defineEmits<{ done: [] }>();

const handleCopy = async () => {
  isSaving.value = true;
  let url: string;

  try {
    if (isBackendEnabled()) {
      const id = await store.getSavedIdOrSave();
      url = `${window.location.origin}/#/result?id=${id}`;
    } else {
      url = createShareUrl(store.surveyState);
    }

    const success = await copyToClipboard(url);
    if (success) {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
        emit('done');
      }, 2000);
    }
  } catch (error) {
    console.error('URL生成エラー', error);
    url = createShareUrl(store.surveyState);
    await copyToClipboard(url);
  } finally {
    isSaving.value = false;
  }
};

const icon = computed(() => {
  if (copySuccess.value) return 'fa-solid fa-check';
  if (isSaving.value) return 'fa-solid fa-spinner';
  return 'fa-regular fa-copy';
});
const text = computed(() => {
  if (copySuccess.value) return 'コピー完了';
  if (isSaving.value) return '保存中...';
  return 'URLをコピー';
});
const variant = computed(() => (copySuccess.value ? 'success' : 'default'));
</script>

<template>
  <MenuItemButton :icon="icon" :text="text" :variant="variant" :spin="isSaving" :disabled="isSaving"
    @click="handleCopy" />
</template>
