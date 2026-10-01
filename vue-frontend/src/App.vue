<script setup lang="ts">
import TheFooter from '@/components/TheFooter.vue'
import TheHeader from '@/components/TheHeader.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePrintColorScheme } from '@/composables/useTheme'

usePrintColorScheme()
</script>

<template>
  <TooltipProvider>
    <div class="flex min-h-svh flex-col print:min-h-0">
      <TheHeader />
      <main class="flex flex-1 flex-col print:block">
        <!-- ResultPage はクエリを setup で一度だけ読む。ResultPage の表示中にアドレスバーから
         別の共有 URL へ移動すると、コンポーネントが再利用されて表示が切り替わらないため、:key に URL を渡して作り直す -->
        <router-view v-slot="{ Component, route }">
          <transition
            mode="out-in"
            enter-active-class="transition-opacity duration-200 ease-out"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150 ease-in"
            leave-to-class="opacity-0"
          >
            <component
              :is="Component"
              :key="route.fullPath"
            />
          </transition>
        </router-view>
      </main>
      <TheFooter />
    </div>
  </TooltipProvider>
</template>
