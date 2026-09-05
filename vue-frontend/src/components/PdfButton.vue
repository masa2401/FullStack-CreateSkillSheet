<script setup lang="ts">
import { computed } from 'vue'

import { Progress } from '@/components/ui/progress'
import type { PdfGenerationState } from '@/composables/usePdfStatus'

import MenuItemButton from './MenuItemButton.vue'

interface Props {
  state: PdfGenerationState
  progress: number
}

const { state, progress } = defineProps<Props>()

const emit = defineEmits<{ download: []; retry: [] }>()

const icon = computed<string>(() => {
  if (state === 'ready') return 'fa-solid fa-check'
  if (state === 'error') return 'fa-solid fa-triangle-exclamation'
  return 'fa-solid fa-spinner'
})

const text = computed<string>(() => {
  if (state === 'ready') return 'PDFをダウンロード'
  if (state === 'error') return 'PDF生成に失敗（再試行）'
  if (state === 'slow') return 'PDF処理に時間がかかっています...'
  return 'PDFを準備中...'
})

const variant = computed<'default' | 'success' | 'error'>(() => {
  if (state === 'ready') return 'success'
  if (state === 'error') return 'error'
  return 'default'
})

const isBusy = computed<boolean>(
  () => state === 'waiting' || state === 'generating' || state === 'slow',
)

const handleClick = (): void => {
  if (state === 'ready') {
    emit('download')
    return
  }
  if (state === 'error') {
    emit('retry')
  }
}
</script>

<template>
  <MenuItemButton
    :icon="icon"
    :text="text"
    :variant="variant"
    :spin="isBusy"
    :disabled="isBusy"
    :close-on-select="false"
    @click="handleClick"
  >
    <Progress
      v-if="isBusy"
      :model-value="progress"
      class="h-1.5"
      aria-label="PDFの生成状況"
    />
  </MenuItemButton>
</template>
