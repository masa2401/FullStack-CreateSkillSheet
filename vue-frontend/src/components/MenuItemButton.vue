<script setup lang="ts">
import { computed } from 'vue'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface Props {
  icon: string
  text: string
  variant?: 'default' | 'success' | 'error'
  spin?: boolean
  disabled?: boolean
  closeOnSelect?: boolean
}

const {
  variant = 'default',
  spin = false,
  disabled = false,
  closeOnSelect = true,
} = defineProps<Props>()

const emit = defineEmits<{ click: [] }>()

const variantClass = computed<string>(() => {
  if (variant === 'success') {
    return 'bg-emerald-100 text-emerald-700 focus:bg-emerald-100 focus:text-emerald-700'
  }
  if (variant === 'error') {
    return 'bg-red-100 text-red-600 focus:bg-red-100 focus:text-red-600'
  }
  return ''
})

const handleSelect = (event: Event): void => {
  if (!closeOnSelect) event.preventDefault()
  emit('click')
}
</script>

<template>
  <DropdownMenuItem
    :disabled="disabled"
    :class="['w-full flex-col items-stretch gap-1 px-3 py-2', variantClass]"
    @select="handleSelect"
  >
    <span class="flex w-full items-center gap-2 text-base font-semibold">
      <span class="menu-icon">
        <font-awesome-icon
          :icon="icon"
          :spin="spin"
        />
      </span>
      <span class="text-left">{{ text }}</span>
    </span>
    <slot />
  </DropdownMenuItem>
</template>
