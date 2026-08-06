<script setup lang="ts">
import { computed } from 'vue'

import { useSuccessFeedback } from '@/composables/useSuccessFeedback.ts'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { downloadCSV } from '@/utils/csvUtils'

import MenuItemButton from './MenuItemButton.vue'

const store = useSurveyStore()

const emit = defineEmits<{ done: [] }>()
const { success: downloadSuccess, trigger } = useSuccessFeedback(() => emit('done'))

const handleDownloadCSV = () => {
  const success = downloadCSV(store.userName, store.selections)
  if (success) {
    downloadSuccess.value = true
    trigger()
  } else {
    console.log('CSVのダウンロードに失敗しました')
  }
}

const icon = computed(() => (downloadSuccess.value ? 'fa-solid fa-check' : 'fa-regular fa-copy'))
const text = computed(() => (downloadSuccess.value ? 'ダウンロード完了' : 'CSVとして保存'))
const variant = computed(() => (downloadSuccess.value ? 'success' : 'default'))
</script>

<template>
  <MenuItemButton
    :icon="icon"
    :text="text"
    :variant="variant"
    @click="handleDownloadCSV"
  />
</template>
