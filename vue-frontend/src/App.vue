<script setup lang="ts">
import TheFooter from '@/components/TheFooter.vue'
import TheHeader from '@/components/TheHeader.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePrintColorScheme } from '@/composables/useTheme'

usePrintColorScheme()
</script>

<template>
  <TooltipProvider>
    <TheHeader />
    <main class="main">
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
  </TooltipProvider>
</template>

<style>
.main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
