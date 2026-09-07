<script setup lang="ts">
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

const handleSelect = (event: Event): void => {
  if (!closeOnSelect) event.preventDefault()
  emit('click')
}
</script>

<template>
  <DropdownMenuItem
    :disabled="disabled"
    :data-feedback="variant === 'default' ? undefined : variant"
    class="w-full flex-col items-stretch gap-1 px-3 py-2 data-[feedback=error]:text-destructive data-[feedback=error]:focus:text-destructive data-[feedback=success]:text-success data-[feedback=success]:focus:text-success data-[feedback=error]:[&_svg]:text-destructive! data-[feedback=success]:[&_svg]:text-success!"
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
