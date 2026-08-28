<script setup lang="ts">
interface Props {
  icon: string
  label: string
  animationType?: 'beat' | 'bounce' | 'fade' | 'spin' | 'none'
  variant?: 'primary' | 'secondary'
}
const { variant = 'primary' } = defineProps<Props>()
defineOptions({ inheritAttrs: false })

const emit = defineEmits<{ click: [] }>()
const handleClick = () => {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    v-bind="$attrs"
    class="action-button"
    :class="variant"
    @click="handleClick"
  >
    <span
      class="button-icon"
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
    <span class="button-text">{{ label }}</span>
  </button>
</template>

<style scoped>
.action-button {
  padding: var(--p-8, 1rem) var(--p-16, 2rem);
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  white-space: nowrap;
  border: 2px solid transparent;
}

.button-icon {
  font-size: 1.1rem;
  display: inline-block;
}

.button-text {
  display: inline-block;
}

.button-icon:deep(svg) {
  animation-name: none;
}

.action-button.primary {
  background: #483c32;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(72, 60, 50, 0.3);
  flex-direction: row-reverse;
}

.action-button.primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(72, 60, 50, 0.4);
  background: #5a4a3e;
}

.action-button.secondary {
  background: #ffffff;
  color: #483c32;
  border-color: #483c32;
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
}

.action-button.secondary:hover {
  background: #483c32;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.25);
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

.action-button:disabled,
.action-button[aria-disabled='true'] {
  animation-name: none;
  background: #94a3b8;
  color: #ffffff;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
  transform: none !important;
}

.action-button[aria-disabled='true']:hover {
  background: #94a3b8;
  color: #ffffff;
  box-shadow: none;
}

.action-button[aria-disabled='true']:hover .button-icon :deep(svg) {
  animation-name: none;
}

@media (max-width: 768px) {
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
