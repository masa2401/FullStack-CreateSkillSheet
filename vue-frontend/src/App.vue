<script setup lang="ts">
import TheFooter from '@/components/TheFooter.vue'
import TheHeader from '@/components/TheHeader.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePrintColorScheme } from '@/composables/useTheme'

usePrintColorScheme()
</script>

<template>
  <TooltipProvider>
    <div class="flex min-h-svh flex-col">
      <TheHeader />
      <main class="flex flex-1 flex-col">
        <router-view v-slot="{ Component }">
          <transition
            name="page"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <TheFooter />
    </div>
  </TooltipProvider>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
