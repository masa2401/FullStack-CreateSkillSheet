<script setup lang="ts">
import { computed, ref } from 'vue'

import { useTimeoutFn } from '@vueuse/core'

import { useSuccessFeedback } from '@/composables/useSuccessFeedback'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { downloadCSV } from '@/utils/csvUtils'

import MenuItemButton from './MenuItemButton.vue'

const store = useSurveyStore()

const emit = defineEmits<{ done: [] }>()
const { success: downloadSuccess, trigger } = useSuccessFeedback(() => emit('done'))

// 失敗表示は成功表示と同じ時間だけ出して元に戻す。メニューは閉じず、その場で再操作できるようにする
const FAILURE_DISPLAY_MS = 2000
const downloadFailed = ref(false)
const { start: startFailureReset } = useTimeoutFn(
  () => {
    downloadFailed.value = false
  },
  FAILURE_DISPLAY_MS,
  { immediate: false },
)

const handleDownloadCSV = () => {
  if (downloadCSV(store.userName, store.selections)) {
    downloadFailed.value = false
    trigger()
    return
  }
  downloadFailed.value = true
  startFailureReset()
}

const icon = computed(() => {
  if (downloadSuccess.value) return 'fa-solid fa-check'
  if (downloadFailed.value) return 'fa-solid fa-triangle-exclamation'
  return 'fa-solid fa-file-csv'
})
const text = computed(() => {
  if (downloadSuccess.value) return 'ダウンロード完了'
  if (downloadFailed.value) return '保存に失敗しました'
  return 'CSVとして保存'
})
const variant = computed<'default' | 'success' | 'error'>(() => {
  if (downloadSuccess.value) return 'success'
  if (downloadFailed.value) return 'error'
  return 'default'
})
</script>

<template>
  <MenuItemButton
    :icon="icon"
    :text="text"
    :variant="variant"
    :close-on-select="false"
    @click="handleDownloadCSV"
  />
</template>
