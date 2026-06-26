<script setup lang="ts">
import { useSurveyStore } from '@/stores/useSurveyStore';
import { copyToClipboard, createShareUrl } from '@/utils/shareUtils';
import { isBackendEnabled } from '@/utils/sheetMapper';
import { ref } from 'vue';

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

</script>
<template>
    <button @click="handleCopy" class="menu-item" :class="{ success: copySuccess }" :disabled="isSaving">
        <span class="menu-icon">
            <font-awesome-icon v-if="copySuccess" icon="fa-solid fa-check" />
            <font-awesome-icon v-else-if="isSaving" icon="fa-solid fa-spinner" spin />
            <font-awesome-icon v-else icon="fa-regular fa-copy" />
        </span>
        <span class="menu-text">{{
            copySuccess ? 'コピー完了' : isSaving ? '保存中...' : 'URLをコピー'
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
