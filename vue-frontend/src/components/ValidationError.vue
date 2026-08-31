<script setup lang="ts">
import { computed } from 'vue'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ValidationError } from '@/types'

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  errors: ValidationError[]
  messageId?: string
  show?: boolean
}

const { errors, messageId = 'error-message', show = undefined } = defineProps<Props>()

const isVisible = computed(() => show ?? errors.length > 0)

// ─── 内部型 ──────────────────────────────────────────────────────────────────

/** カテゴリ × 質問 でグループ化したエラーを表す型 */
interface GroupedError extends ValidationError {
  count: number
}

// ─── ロジック ────────────────────────────────────────────────────────────────

const groupedErrors = computed<GroupedError[]>(() => {
  const groups: Record<string, GroupedError> = {}

  errors.forEach((error) => {
    const key = `${error.category}|${error.text ?? ''}`
    if (!groups[key]) {
      groups[key] = {
        category: error.category,
        text: error.text,
        count: 0,
      }
    }
    groups[key].count++
  })

  return Object.values(groups)
})
</script>

<template>
  <transition name="fade">
    <Alert
      v-if="isVisible"
      :id="messageId"
      variant="destructive"
      class="error-alert mt-8"
      role="alert"
      aria-live="assertive"
      tabindex="-1"
    >
      <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
      <AlertTitle class="text-lg font-bold">入力エラー</AlertTitle>
      <AlertDescription>
        <slot name="description"></slot>
        <ul class="mt-2 flex list-none flex-col gap-1">
          <li
            v-for="(group, index) in groupedErrors"
            :key="index"
            class="flex items-baseline gap-2"
          >
            <font-awesome-icon
              icon="fa-solid fa-circle-exclamation"
              class="shrink-0 text-sm"
            />
            <span class="flex flex-col">
              <span class="flex flex-wrap items-center gap-1">
                <strong class="font-bold">{{ group.category }}</strong>
                <span class="text-sm font-semibold">（{{ group.count }}件）</span>
              </span>
              <span
                v-if="group.text"
                class="text-sm leading-snug opacity-80"
                >{{ group.text }}</span
              >
            </span>
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  </transition>
</template>

<style scoped>
/* animation-name の指定は Tailwind で表現できないためスコープCSSで維持する */
.error-alert {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
