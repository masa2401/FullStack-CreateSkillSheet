<script setup lang="ts">
import { ref } from 'vue'

import { onClickOutside, useEventListener } from '@vueuse/core'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import { GUEST_HINT_MESSAGE, useGuestGate } from '@/composables/useGuestGate'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { isBackendEnabled } from '@/utils/api'

import CsvButton from './CsvButton.vue'
import MenuItemButton from './MenuItemButton.vue'
import PdfButton from './PdfButton.vue'
import ShareUrlButton from './ShareUrlButton.vue'

const store = useSurveyStore()
const showMenu = ref<boolean>(false)

const containerRef = ref<HTMLElement | null>(null)
const {
  isGuest,
  isTooltipVisible,
  guard,
  goToNameInput,
  handleMouseEnter,
  handleMouseLeave,
  handleFocusIn,
  handleFocusOut,
} = useGuestGate(containerRef)

const toggleMenu = async () => {
  showMenu.value = !showMenu.value

  if (showMenu.value && isBackendEnabled()) {
    try {
      await store.getSavedIdOrSave()
    } catch (error) {
      console.error('シート保存エラー:', error)
    }
  }
}

const handleButtonClick = (): void => {
  guard(() => {
    void toggleMenu()
  })
}

const closeMenu = () => {
  showMenu.value = false
}

onClickOutside(containerRef, closeMenu)

useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showMenu.value) {
    closeMenu()
  }
})

const handlePrintAndClose = (): void => {
  window.print()
  closeMenu()
}
</script>

<template>
  <div
    ref="containerRef"
    class="share-button-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <AnimatedIconButton
      animationType="bounce"
      icon="fa-solid fa-arrow-up-right-from-square"
      label="結果を印刷/共有"
      variant="secondary"
      :aria-expanded="showMenu"
      :aria-disabled="isGuest"
      aria-haspopup="true"
      @click="handleButtonClick"
    />
    <transition name="slide-fade">
      <div
        v-if="showMenu"
        class="share-menu"
        role="menu"
      >
        <MenuItemButton
          icon="fa-solid fa-print"
          text="印刷する"
          @click="handlePrintAndClose"
        />
        <CsvButton @done="closeMenu" />
        <ShareUrlButton @done="closeMenu" />
        <PdfButton
          v-if="isBackendEnabled()"
          @done="closeMenu"
        />
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="isTooltipVisible"
        class="guest-tooltip"
        role="tooltip"
      >
        <p class="guest-tooltip-message">{{ GUEST_HINT_MESSAGE }}</p>
        <button
          type="button"
          class="guest-tooltip-link"
          @click="goToNameInput"
        >
          お名前を入力する
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.share-button-container {
  position: relative;
}

.share-menu {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.15);
  border: 1px solid #483c32;
  padding: var(--p-4, 0.5rem);
  min-width: 200px;
  z-index: 100;
}

/* アニメーション */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateX(-50%) translateY(10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-50%) translateY(10px);
  opacity: 0;
}

.guest-tooltip {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.15);
  border: 1px solid #483c32;
  padding: var(--p-8, 1rem);
  width: max-content;
  max-width: 220px;
  z-index: 100;
  text-align: center;
}

.guest-tooltip-message {
  color: #483c32;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0 0 var(--p-4, 0.5rem);
}

.guest-tooltip-link {
  display: inline-block;
  margin-top: var(--p-4, 0.5rem);
  background: #483c32;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  padding: 0.4rem 1rem;
}

.guest-tooltip-link:hover,
.guest-tooltip-link:focus-visible {
  background: #5a4a3e;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .share-menu {
    left: 0;
    right: 0;
    transform: none;
    margin: 0 var(--p-8, 1rem);
  }

  .guest-tooltip {
    left: 0;
    right: 0;
    transform: none;
    margin: 0 var(--p-8, 1rem);
    max-width: none;
  }
}
</style>
