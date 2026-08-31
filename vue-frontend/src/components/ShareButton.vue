<script setup lang="ts">
import { ref } from 'vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GUEST_HINT_MESSAGE, useGuestGate } from '@/composables/useGuestGate'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { isBackendEnabled } from '@/utils/api'

import CsvButton from './CsvButton.vue'
import MenuItemButton from './MenuItemButton.vue'
import PdfButton from './PdfButton.vue'
import ShareUrlButton from './ShareUrlButton.vue'

const store = useSurveyStore()
const showMenu = ref<boolean>(false)

const { isGuest, guard, goToNameInput } = useGuestGate()

const openMenu = async (): Promise<void> => {
  showMenu.value = true

  if (!isBackendEnabled()) return

  try {
    await store.getSavedIdOrSave()
  } catch (error) {
    console.error('シート保存エラー:', error)
  }
}

/**
 * DropdownMenu の開閉要求をゲストゲートに通す。
 * 外側クリック・Escape・項目選択による「閉じる」はそのまま反映する。
 */
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
</script>

<template>
  <!--
    TooltipTrigger と DropdownMenuTrigger を as-child で入れ子にすると、
    Popper のアンカー要素が解決できずメニューが画面外に描画される。
    ゲスト時はメニューを開かせないので、状態で描画そのものを分ける。
  -->
  <Tooltip v-if="isGuest">
    <TooltipTrigger as-child>
      <AnimatedIconButton
        animationType="bounce"
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
        animationType="bounce"
        icon="fa-solid fa-arrow-up-right-from-square"
        label="結果を印刷/共有"
        variant="secondary"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="center"
      side="top"
      :side-offset="8"
      class="min-w-[200px]"
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
        @done="closeMenu"
      />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
