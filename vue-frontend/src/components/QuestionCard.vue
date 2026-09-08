<script setup lang="ts">
import type { MergedQuestion, StarLevel } from '@/types'

import AnswerItem from './AnswerItem.vue'

interface Props {
  question: MergedQuestion
  questionNumber: number
  flaggedAnswerIds?: number[]
}

const { question, questionNumber, flaggedAnswerIds = [] } = defineProps<Props>()

const emit = defineEmits<{
  'update:answer': [
    payload: { answerId: number; patch: { isChecked?: boolean; value?: StarLevel } },
  ]
}>()
</script>

<template>
  <section>
    <h3 class="text-lg leading-relaxed font-semibold">
      Q{{ questionNumber }}. {{ question.title }}
    </h3>
    <p class="text-sm text-muted-foreground">{{ question.prompt }}</p>
    <div class="mt-4 flex flex-col gap-4">
      <AnswerItem
        v-for="answer in question.answers"
        :key="answer.id"
        :answer-id="answer.id"
        :label="answer.label"
        :is-checked="answer.isChecked"
        :value="answer.value"
        :is-flagged="flaggedAnswerIds.includes(answer.id)"
        @update:answer="emit('update:answer', $event)"
      />
    </div>
  </section>
</template>
