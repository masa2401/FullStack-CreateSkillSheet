<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'

import { type ButtonVariants, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  inactive?: boolean
  class?: HTMLAttributes['class']
}

const { variant, size, inactive = false, class: className } = defineProps<Props>()

const classes = computed<string>(() =>
  cn(
    buttonVariants({ variant, size }),
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:shadow-none',
    className,
  ),
)
</script>

<template>
  <button
    type="button"
    :class="classes"
    :aria-disabled="inactive"
  >
    <slot />
  </button>
</template>
