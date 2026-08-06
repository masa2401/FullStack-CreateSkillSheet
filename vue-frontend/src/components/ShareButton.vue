<script setup lang="ts">
import { ref } from 'vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import { useSurveyStore } from '@/stores/useSurveyStore.ts'
import { isBackendEnabled } from '@/utils/api.ts'

import CsvButton from './CsvButton.vue'
import PdfButton from './PdfButton.vue'
import ShareUrlButton from './ShareUrlButton.vue'

const store = useSurveyStore()
const showMenu = ref<boolean>(false)

const toggleMenu = async () => {
  showMenu.value = !showMenu.value

  if (showMenu.value && isBackendEnabled()) {
    try {
      await store.getSavedIdOrSave()
    } catch (error) {
      console.error('シート保存エラー', error)
    }
  }
}

const closeMenu = () => {
  showMenu.value = false
}
</script>

<template>
  <div class="share-button-container">
    <AnimatedIconButton
      animationType="bounce"
      icon="fa-solid fa-arrow-up-right-from-square"
      label="結果を共有"
      variant="secondary"
      :aria-expanded="showMenu"
      aria-haspopup="true"
      @click="toggleMenu"
    />
    <transition name="slide-fade">
      <div
        v-if="showMenu"
        class="share-menu"
        role="menu"
      >
        <ShareUrlButton @done="closeMenu" />
        <CsvButton @done="closeMenu" />
        <PdfButton
          v-if="isBackendEnabled()"
          @done="closeMenu"
        />
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

@media (max-width: 768px) {
  .share-button {
    width: 100%;
    justify-content: center;
  }

  .share-menu {
    left: 0;
    right: 0;
    transform: none;
    margin: 0 var(--p-8, 1rem);
  }
}
</style>
