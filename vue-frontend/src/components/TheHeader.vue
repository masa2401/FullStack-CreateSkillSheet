<script setup lang="ts">
import { useRoute } from 'vue-router'

import { SquarePen } from '@lucide/vue'

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
  <header class="bg-card border-b print:hidden">
    <div
      class="relative mx-auto flex h-14 w-full max-w-5xl items-center justify-center px-4 sm:h-16 sm:px-6"
    >
      <h1 class="min-w-0">
        <button
          type="button"
          class="text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-md text-lg font-bold transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:outline-none sm:text-xl"
          :aria-label="`スキルシート制作ページ（${route.path !== ROUTES.TOP ? 'トップページへ戻る' : 'TOPページ'}）`"
          @click="handleTitleClick"
        >
          <SquarePen
            class="size-5 shrink-0 sm:size-6"
            aria-hidden="true"
          />
          <span class="truncate">スキルシート制作ページ</span>
        </button>
      </h1>
      <ThemeToggle class="absolute top-1/2 right-4 -translate-y-1/2 sm:right-6" />
    </div>
  </header>
</template>
