<script setup lang="ts">
import { useSurveyStore } from '@/stores/useSurveyStore';
import { downloadCSV } from '@/utils/csvUtils';
import { computed, ref } from 'vue';
import MenuItemButton from './MenuItemButton.vue';

const store = useSurveyStore();
const downloadSuccess = ref<boolean>(false);

const emit = defineEmits<{ done: [] }>();

const handleDownloadCSV = () => {
    const success = downloadCSV(store.userName, store.selections);
    if (success) {
        downloadSuccess.value = true;
        setTimeout(() => {
            downloadSuccess.value = false;
            emit('done');
        }, 2000);
    } else {
        console.log('CSVのダウンロードに失敗しました');
    }
};

const icon = computed(() => (downloadSuccess.value ? 'fa-solid fa-check' : 'fa-regular fa-copy'));
const text = computed(() => (downloadSuccess.value ? 'ダウンロード完了' : 'CSVとして保存'));
const variant = computed(() => (downloadSuccess.value ? 'success' : 'default'));
</script>

<template>
    <MenuItemButton :icon="icon" :text="text" :variant="variant" @click="handleDownloadCSV" />
</template>