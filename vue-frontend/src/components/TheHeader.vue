<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ROUTES } from '@/utils/constants'

const router = useRouter()
const route = useRoute()

const goToTop = () => {
  if (route.path !== ROUTES.TOP) {
    router.push(ROUTES.TOP)
  }
}
</script>

<template>
  <header class="header">
    <h1 class="title" @click="goToTop" @keydown.enter="goToTop" @keydown.space.prevent="goToTop" role="button"
      tabindex="0" :aria-label="route.path !== ROUTES.TOP ? 'トップページへ戻る' : '現在のページ（トップページ）'">
      <span class="icon">
        <font-awesome-icon icon="fa-solid fa-pen-to-square" />
      </span>
      スキルシート制作ページ
    </h1>
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
