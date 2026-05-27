<script setup lang="ts">
import type { Answer, StarLevel } from '@/types';
import { LEVEL_LABELS } from '@/utils/constants';

interface Props {
  answer: Answer;
  answerIndex: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:answer': [answer: Answer];
}>();

// チェックボックスの変更
const handleCheckChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:answer', {
    ...props.answer,
    isChecked: target.checked,
  });
};

// 習熟度の変更
const handleLevelChange = (level: StarLevel) => {
  emit('update:answer', {
    ...props.answer,
    value: level,
  });
};
</script>

<template>
  <div class="answer-item">
    <label class="checkbox-label">
      <input type="checkbox" :checked="answer.isChecked" @change="handleCheckChange" class="custom-checkbox" />
      <span class="checkbox-text">{{ answer.label }}</span>
    </label>

    <transition name="slide-fade">
      <div v-if="answer.isChecked" class="level-selector">
        <div class="level-buttons">
          <label v-for="level in 5" :key="level" class="level-button" :class="{ active: answer.value === level }"
            :aria-label="`習熟度 ${level}: ${LEVEL_LABELS[level - 1]!.text}`">
            <input type="radio" :checked="answer.value === level" @change="handleLevelChange(level as StarLevel)"
              class="level-radio" :aria-label="`${level}段階`" />
            <span class="level-number">{{ level }}</span>
            <span class="level-stars">{{ '★'.repeat(level) }}</span>
          </label>
        </div>
        <span v-if="!answer.value" class="warning-text">
          <font-awesome-icon icon="fa-regular fa-lightbulb" />
          習熟度を選択してください
        </span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.answer-item {
  border-left: 4px solid #d3c6a6;
  padding-left: var(--p-8, 1rem);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  cursor: pointer;
  font-size: 1rem;
  color: #444;
  padding: var(--p-4, 0.5rem) 0;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #483c32;
}

.checkbox-text {
  flex: 1;
  line-height: 1.5;
}

.level-selector {
  margin-top: var(--p-4, 0.5rem);
  padding: var(--p-8, 1rem);
  background: #ffffff;
  border-radius: var(--radius, 12px);
  border: 1px solid #d3c6a6;
}

.level-buttons {
  display: flex;
  gap: var(--p-4, 0.5rem);
  margin-bottom: var(--p-4, 0.5rem);
  flex-wrap: wrap;
}

.level-button {
  flex: 1;
  min-width: 80px;
  padding: var(--p-4, 0.5rem);
  background: #ffffff;
  border: 2px solid #d3c6a6;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--p-4, 0.5rem);
}

.level-button:hover {
  border-color: #483c32;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 60, 50, 0.15);
}

.level-button.active {
  background: #483c32;
  border-color: #483c32;
  color: #ffffff;
  transform: scale(1.05);
}

.level-radio {
  display: none;
}

.level-number {
  font-size: 1.2rem;
  font-weight: 700;
}

.level-stars {
  font-size: 0.75rem;
  opacity: 0.8;
}

.warning-text {
  color: #f59e0b;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  display: block;
  animation: pulse 2s infinite;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

@media (max-width: 768px) {
  .level-buttons {
    gap: var(--p-4, 0.5rem);
  }

  .level-button {
    min-width: 60px;
    padding: var(--p-4, 0.5rem);
  }

  .level-number {
    font-size: 1rem;
  }

  .level-stars {
    font-size: 0.65rem;
  }
}
</style>
