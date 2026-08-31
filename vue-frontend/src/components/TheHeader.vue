<script setup lang="ts">
import { useRoute } from 'vue-router'

import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { ROUTES } from '@/utils/constants'

const route = useRoute()
const { goToTop } = useAppNavigation()

const handleTitleClick = () => {
  if (route.path !== ROUTES.TOP) {
    goToTop()
  }
}
</script>

<template>
  <header class="header relative">
    <h1>
      <button
        class="title"
        @click="handleTitleClick"
        @keydown.enter="handleTitleClick"
        @keydown.space.prevent="handleTitleClick"
        tabindex="0"
        :aria-label="`スキルシート制作ページ（${route.path !== ROUTES.TOP ? 'トップページへ戻る' : 'TOPページ'}）`"
      >
        <span class="icon">
          <font-awesome-icon icon="fa-solid fa-pen-to-square" />
        </span>
        スキルシート制作ページ
      </button>
    </h1>
    <ThemeToggle class="absolute top-1/2 right-4 -translate-y-1/2" />
  </header>
</template>

<style scoped>
.header {
  background: linear-gradient(135deg, #483c32 0%, #5a4a3e 100%);
  padding: var(--p-12, 1.5rem) 0;
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.2);
  overflow: hidden;
}

.title {
  width: 100%;
  margin: 0;
  text-align: center;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: transparent;
  border: transparent;
}

.title:hover {
  transform: scale(1.02);
}

.icon {
  font-size: 1.8rem;
  display: inline-block;
  vertical-align: baseline;
}

@media (max-width: 768px) {
  .title {
    font-size: 1.2rem;
  }

  .icon {
    font-size: 1.5rem;
  }
}

@media print {
  .header {
    display: none !important;
  }
}
</style>
