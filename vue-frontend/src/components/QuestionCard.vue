<script setup lang="ts">
import type { StarLevel } from '@/types';
import AnswerItem from './AnswerItem.vue';

interface Answer {
  id: number;
  label: string;
  isChecked: boolean;
  value?: StarLevel;
}

interface Question {
  id: number;
  questionText: string;
  answers: Answer[];
}

interface Props {
  question: Question;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:answer': [
    payload: { answerId: number; patch: { isChecked?: boolean; value?: StarLevel } },
  ];
}>();
</script>

<template>
  <div class="question-card">
    <h4 class="question-text">{{ question.questionText }}</h4>
    <div class="answers-grid">
      <AnswerItem
        v-for="answer in question.answers"
        :key="answer.id"
        :answer-id="answer.id"
        :label="answer.label"
        :is-checked="answer.isChecked"
        :value="answer.value"
        @update:answer="emit('update:answer', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.question-card {
  background: #ffffff;
  border-radius: 15px;
  padding: var(--p-12, 1.5rem) var(--p-8, 1rem);
  transition: transform 0.2s;
  width: 80ch;
  margin: 0 auto;
}

.question-text {
  font-size: 1.1rem;
  margin: 0 0 var(--p-8, 1rem) 0;
  color: #483c32;
  font-weight: 600;
  line-height: 1.6;
}

.answers-grid {
  display: flex;
  flex-direction: column;
  gap: var(--p-8, 1rem);
}

@media (max-width: 768px) {
  .question-card {
    padding: var(--p-12, 1.5rem);
    width: 100%;
  }
}
</style>
