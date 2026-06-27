<script setup lang="ts">
import AnimatedIconButton from '@/components/AnimatedIconButton.vue';
import { ref } from 'vue';
import CsvButton from './CsvButton.vue';
import ShareUrlButton from './ShareUrlButton.vue';

const showMenu = ref<boolean>(false);

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const closeMenu = () => {
  showMenu.value = false;
};
</script>

<template>
  <div class="share-button-container">
    <AnimatedIconButton
      icon="fa-solid fa-arrow-up-right-from-square"
      label="結果を共有"
      :aria-expanded="showMenu"
      aria-haspopup="true"
      animationType="bounce"
      button-class="share-button"
      @click="toggleMenu"
    />

    <transition name="slide-fade">
      <div v-if="showMenu" class="share-menu">
        <ShareUrlButton @done="closeMenu" />
        <CsvButton @done="closeMenu" />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.share-button-container {
  position: relative;
}

.share-button {
  height: 100%;
  padding: var(--p-8, 1rem) var(--p-16, 2rem);
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: #ffffff;
  color: #483c32;
  border-color: #483c32;
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
  display: inline-flex;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  white-space: nowrap;
}

.share-button:hover {
  background: #483c32;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.25);
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
