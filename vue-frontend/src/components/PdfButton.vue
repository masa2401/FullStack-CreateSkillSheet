<script setup lang="ts">
import { usePdfStatus } from '@/composables/usePdfStatus';
import { useSurveyStore } from '@/stores/useSurveyStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MenuItemButton from './MenuItemButton.vue';

const store = useSurveyStore();
const { savedSheetId } = storeToRefs(store);

const emit = defineEmits<{ done: [] }>();

const { state, downloadUrl, retry } = usePdfStatus(savedSheetId);

const icon = computed(() => {
    if (state.value === 'ready') return 'fa-solid fa-check';
    if (state.value === 'error') return 'fa-solid fa-triangle-exclamation';
    return 'fa-solid fa-spinner';
});
const text = computed(() => {
    if (state.value === 'ready') return 'PDFをダウンロード';
    if (state.value === 'error') return 'PDF生成に失敗（再試行）';
    return 'PDFを準備中...';
});
const variant = computed(() => {
    if (state.value === 'ready') return 'success';
    if (state.value === 'error') return 'error';
    return 'default';
});
const isBusy = computed(() => state.value === 'waiting' || state.value === 'generating');

const handleClick = () => {
    if (state.value === 'ready') {
        window.open(downloadUrl.value, '_blank');
        emit('done');
        return;
    }
    if (state.value === 'error') {
        retry();
    }
}
</script>

<template>
    <MenuItemButton :icon="icon" :text="text" :variant="variant" :spin="isBusy" :disabled="isBusy"
        @click="handleClick" />
</template>