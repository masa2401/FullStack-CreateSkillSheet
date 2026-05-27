<script setup lang="ts">
import AnswerItem from './AnswerItem.vue';
import type { QuestionState, Answer } from '@/types';

interface Props {
  question: QuestionState;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  'update:question': [updatedQuestion: QuestionState];
}>();

// 回答の更新を親コンポーネントに伝達

const handleAnswerUpdate = (answerIndex: number, updatedAnswer: Answer) => {
  const updatedQuestion: Props['question'] = {
    ...props.question,
    answers: props.question.answers.map((answer, index) =>
      index === answerIndex ? updatedAnswer : answer,
    ),
  };
  emit('update:question', updatedQuestion);
};
</script>

<template>
  <div class="question-card">
    <h4 class="question-text">{{ question.questionText }}</h4>
    <div class="answers-grid">
      <AnswerItem v-for="(answer, index) in question.answers" :key="index" :answer="answer" :answer-index="index"
        @update:answer="handleAnswerUpdate(index, $event)" />
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
