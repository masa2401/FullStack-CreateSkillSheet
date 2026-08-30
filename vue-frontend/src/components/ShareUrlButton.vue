<script setup lang="ts">
import { computed, ref } from 'vue'

import { useSuccessFeedback } from '@/composables/useSuccessFeedback'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { isBackendEnabled } from '@/utils/api'
import { copyToClipboard, createShareUrl } from '@/utils/shareUtils'

import MenuItemButton from './MenuItemButton.vue'

const store = useSurveyStore()
const isSaving = ref<boolean>(false)

const emit = defineEmits<{ done: [] }>()
const { success: copySuccess, trigger } = useSuccessFeedback(() => emit('done'))

const copyAndNotify = async (url: string) => {
  const success = await copyToClipboard(url)
  if (success) {
    copySuccess.value = true
    trigger()
  }
}

const handleCopy = async () => {
  isSaving.value = true

  try {
    const url = isBackendEnabled()
      ? `${window.location.origin}/#/result?id=${await store.getSavedIdOrSave()}`
      : createShareUrl(store.surveyState)
    await copyAndNotify(url)
  } catch (error) {
    console.error('URL生成エラー:', error)
    await copyAndNotify(createShareUrl(store.surveyState))
  } finally {
    isSaving.value = false
  }
}

const icon = computed(() => {
  if (copySuccess.value) return 'fa-solid fa-check'
  if (isSaving.value) return 'fa-solid fa-spinner'
  return 'fa-regular fa-copy'
})
const text = computed(() => {
  if (copySuccess.value) return 'コピー完了'
  if (isSaving.value) return '保存中...'
  return 'URLをコピー'
})
const variant = computed(() => (copySuccess.value ? 'success' : 'default'))
</script>

<template>
  <MenuItemButton
    :icon="icon"
    :text="text"
    :variant="variant"
    :spin="isSaving"
    :disabled="isSaving"
    :close-on-select="false"
    @click="handleCopy"
  />
</template>
