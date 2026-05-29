<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  icon: string;
  label: string;
  animationType?: 'beat' | 'bounce' | 'fade' | 'spin' | 'none';
  buttonClass?: string;
}
defineProps<Props>();
defineOptions({ inheritAttrs: false })

const isHovering = ref(false);
const emit = defineEmits<{
  click: [];
}>();
const handleClick = () => {
  emit('click');
};
</script>

<template>
  <button type="button" v-bind="$attrs" @click="handleClick" :class="buttonClass" @mouseenter="isHovering = true"
    @mouseleave="isHovering = false">
    <span class="button-icon" aria-hidden="true">
      <font-awesome-icon :icon="icon" :beat="animationType === 'beat' && isHovering"
        :bounce="animationType === 'bounce' && isHovering" :fade="animationType === 'fade' && isHovering"
        :spin="animationType === 'spin' && isHovering" />
    </span>
    <span class="button-text">{{ label }}</span>
  </button>
</template>

<style scoped>
.button-icon {
  font-size: 1.1rem;
  display: inline-block;
}

.button-text {
  display: inline-block;
}
</style>
