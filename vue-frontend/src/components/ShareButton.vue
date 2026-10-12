<script setup lang="ts">
import { computed, ref } from 'vue'

import { storeToRefs } from 'pinia'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GUEST_HINT_MESSAGE, useGuestGate } from '@/composables/useGuestGate'
import { type PdfGenerationState, usePdfStatus } from '@/composables/usePdfStatus'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { isBackendEnabled } from '@/utils/api'

import CsvButton from './CsvButton.vue'
import MenuItemButton from './MenuItemButton.vue'
import PdfButton from './PdfButton.vue'
import ShareUrlButton from './ShareUrlButton.vue'

const store = useSurveyStore()
const showMenu = ref<boolean>(false)

const { isGuest, guard, goToNameInput } = useGuestGate()

const { savedSheetId } = storeToRefs(store)
const {
  state: pdfState,
  downloadUrl: pdfDownloadUrl,
  progress: pdfProgress,
  start: startPdfStatus,
  retry: retryPdf,
} = usePdfStatus(savedSheetId)

const isSaving = ref<boolean>(false)
const saveFailed = ref<boolean>(false)

const preparePdf = async (): Promise<void> => {
  isSaving.value = true
  try {
    await store.getSavedIdOrSave()
    saveFailed.value = false
    startPdfStatus()
  } catch (error) {
    console.error('シート保存エラー:', error)
    saveFailed.value = true
  } finally {
    isSaving.value = false
  }
}

/** PDF の生成状態に、保存の状態を重ねたもの。保存の失敗も再試行できるよう `error` として見せる */
const pdfButtonState = computed<PdfGenerationState>(() => {
  if (isSaving.value) return 'waiting'
  if (saveFailed.value) return 'error'
  return pdfState.value
})

/**
 * 保存の失敗は保存から、生成の失敗は regenerate でやり直す。
 * 保存に失敗した時の savedSheetId は変更前のシートを指していることがあり、regenerate すると古い内容の PDF になるため
 */
const handlePdfRetry = (): void => {
  void (saveFailed.value ? preparePdf() : retryPdf())
}

const openMenu = async (): Promise<void> => {
  showMenu.value = true

  if (!isBackendEnabled()) return

  await preparePdf()
}

const handleOpenChange = (open: boolean): void => {
  if (!open) {
    showMenu.value = false
    return
  }
  guard(() => {
    void openMenu()
  })
}

const closeMenu = (): void => {
  showMenu.value = false
}

const handlePrint = (): void => {
  window.print()
}

const handlePdfDownload = (): void => {
  window.open(pdfDownloadUrl.value, '_blank')
  closeMenu()
}
</script>

<template>
  <Tooltip v-if="isGuest">
    <TooltipTrigger as-child>
      <AnimatedIconButton
        animation-type="bounce"
        icon="fa-solid fa-arrow-up-right-from-square"
        label="結果を印刷/共有"
        variant="secondary"
        inactive
        @click="goToNameInput"
      />
    </TooltipTrigger>
    <TooltipContent>{{ GUEST_HINT_MESSAGE }}</TooltipContent>
  </Tooltip>

  <DropdownMenu
    v-else
    :open="showMenu"
    :modal="false"
    @update:open="handleOpenChange"
  >
    <DropdownMenuTrigger as-child>
      <AnimatedIconButton
        animation-type="bounce"
        icon="fa-solid fa-arrow-up-right-from-square"
        label="結果を印刷/共有"
        variant="secondary"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="center"
      side="top"
      :side-offset="8"
      class="min-w-50 print:hidden"
    >
      <MenuItemButton
        icon="fa-solid fa-print"
        text="印刷する"
        @click="handlePrint"
      />
      <CsvButton @done="closeMenu" />
      <ShareUrlButton @done="closeMenu" />
      <PdfButton
        v-if="isBackendEnabled()"
        :state="pdfButtonState"
        :progress="isSaving ? 0 : pdfProgress"
        @download="handlePdfDownload"
        @retry="handlePdfRetry"
      />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
