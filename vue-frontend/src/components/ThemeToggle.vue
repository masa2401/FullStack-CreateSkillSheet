<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'

import AppButton from '@/components/AppButton.vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <AppButton
    variant="ghost"
    size="icon"
    :aria-label="isDark ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える'"
    :aria-pressed="isDark"
    class="print:hidden"
    @click="toggleTheme"
  >
    <Moon
      v-if="isDark"
      class="size-5"
    />
    <Sun
      v-else
      class="size-5"
    />
  </AppButton>
</template>
