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
  <header class="border-b print:hidden">
    <div
      class="mx-auto flex w-full max-w-5xl items-center justify-center gap-2 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5"
    >
      <div
        class="size-9 shrink-0"
        aria-hidden="true"
      />
      <h1 class="flex min-w-0">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md text-lg font-bold text-foreground transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:text-xl"
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
      <ThemeToggle />
    </div>
  </header>
</template>
