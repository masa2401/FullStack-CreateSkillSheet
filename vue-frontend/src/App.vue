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
            mode="out-in"
            enter-active-class="transition-opacity duration-200 ease-out"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150 ease-in"
            leave-to-class="opacity-0"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <TheFooter />
    </div>
  </TooltipProvider>
</template>
