<script setup lang="ts">
import { useSurveyStore } from '@/stores/useSurveyStore';
import { downloadCSV } from '@/utils/csvUtils';
import { ref } from 'vue';

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
</script>
<template>
    <button @click="handleDownloadCSV" class="menu-item" :class="{ success: downloadSuccess }">
        <span class="menu-icon">
            <font-awesome-icon v-if="downloadSuccess" icon="fa-solid fa-check" />
            <font-awesome-icon v-else icon="fa-regular fa-copy" />
        </span>
        <span class="menu-text">{{
            downloadSuccess ? 'ダウンロード完了' : 'CSVとして保存'
            }}</span>
    </button>
</template>
<style scoped>
.menu-item {
    width: 100%;
    padding: var(--p-8, 1rem);
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    justify-content: start;
    align-items: center;
    gap: var(--p-4, 0.5rem);
    border-radius: 10px;
    transition: all 0.2s;
    font-size: 1rem;
    font-weight: 600;
    color: #483c32;
}

.menu-item:hover {
    background: #f5f5f5;
}

.menu-item.success {
    background: #d1fae5;
    color: #059669;
}

.menu-icon {
    font-size: 1rem;
}

.menu-text {
    text-align: left;
}
</style>