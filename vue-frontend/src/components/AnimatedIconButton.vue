<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'

interface Props {
  icon: string
  label: string
  animationType?: 'beat' | 'bounce' | 'fade' | 'spin' | 'none'
  variant?: 'primary' | 'secondary'
  inactive?: boolean
}
const { variant = 'primary', inactive = false } = defineProps<Props>()
defineOptions({ inheritAttrs: false })

const emit = defineEmits<{ click: [] }>()
const handleClick = () => {
  emit('click')
}
</script>

<template>
  <AppButton
    v-bind="$attrs"
    size="lg"
    :variant="variant === 'primary' ? 'default' : 'outline'"
    :inactive="inactive"
    :class="['action-button max-md:w-full', variant === 'primary' ? 'flex-row-reverse' : '']"
    @click="handleClick"
  >
    <span
      class="button-icon text-[1.1rem]"
      aria-hidden="true"
    >
      <font-awesome-icon
        :icon="icon"
        :beat="animationType === 'beat'"
        :bounce="animationType === 'bounce'"
        :fade="animationType === 'fade'"
        :spin="animationType === 'spin'"
      />
    </span>
    <span>{{ label }}</span>
  </AppButton>
</template>

<style scoped>
.button-icon :deep(svg) {
  animation-name: none;
}

.action-button:hover .button-icon :deep(svg.fa-beat) {
  animation-name: fa-beat;
}

.action-button:hover .button-icon :deep(svg.fa-bounce) {
  animation-name: fa-bounce;
}

.action-button:hover .button-icon :deep(svg.fa-fade) {
  animation-name: fa-fade;
}

.action-button:hover .button-icon :deep(svg.fa-spin) {
  animation-name: fa-spin;
}

.action-button[aria-disabled='true']:hover .button-icon :deep(svg) {
  animation-name: none;
}
</style>
