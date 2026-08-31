<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { MergedQuestion, StarLevel } from '@/types'

import AnswerItem from './AnswerItem.vue'

interface Props {
  question: MergedQuestion
  questionNumber: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:answer': [
    payload: { answerId: number; patch: { isChecked?: boolean; value?: StarLevel } },
  ]
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg leading-relaxed font-semibold">
        Q{{ questionNumber }}. {{ question.title }}
      </CardTitle>
      <CardDescription>{{ question.prompt }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <AnswerItem
        v-for="answer in question.answers"
        :key="answer.id"
        :answer-id="answer.id"
        :label="answer.label"
        :is-checked="answer.isChecked"
        :value="answer.value"
        @update:answer="emit('update:answer', $event)"
      />
    </CardContent>
  </Card>
</template>
