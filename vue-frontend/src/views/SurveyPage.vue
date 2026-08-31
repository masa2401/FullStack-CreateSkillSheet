<script setup lang="ts">
import { computed, nextTick } from 'vue'

import { Check } from '@lucide/vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import ValidationError from '@/components/ValidationError.vue'
import { resolveCategoryIcon } from '@/components/icons/categoryIcons'
import { Card, CardContent } from '@/components/ui/card'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { useMergedSurvey } from '@/composables/useMergedSurvey'
import { useSurveyValidation } from '@/composables/useSurveyValidation'
import { useSurveyStore } from '@/stores/useSurveyStore'
import type { StarLevel } from '@/types'
import { LEVEL_LABELS } from '@/utils/constants'

const store = useSurveyStore()
const { goToResult } = useAppNavigation()

const { mergedCategories } = useMergedSurvey()
const { validationErrors, validate, isSubmitDisabled, hasAttemptedSubmit } =
  useSurveyValidation(mergedCategories)

const noAnswersError = computed(() => hasAttemptedSubmit.value && !store.hasAnswers)

// ─── イベントハンドラ ────────────────────────────────────────────────────────

const handleAnswerUpdate = (
  categoryId: number,
  questionId: number,
  answerId: number,
  patch: { isChecked?: boolean; value?: StarLevel },
): void => {
  store.setAnswerSelection(categoryId, questionId, answerId, patch)
}

const handleSubmit = async (): Promise<void> => {
  const isValid = validate()

  if (!store.hasAnswers) {
    await nextTick()
    const target = document.getElementById('no-answers-message')
    target?.scrollIntoView({ behavior: 'smooth' })
    target?.focus()
    return
  }

  if (!isValid) {
    await nextTick()
    const target = document.getElementById('error-message')
    target?.scrollIntoView({ behavior: 'smooth' })
    target?.focus()
    return
  }
  goToResult()
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <Card>
      <CardContent class="space-y-4">
        <p class="flex items-center justify-center gap-2 text-center leading-relaxed">
          <Check
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          以下の質問で該当する項目を選択後、習熟度を5段階で選択してください。
        </p>
        <ul class="text-muted-foreground mx-auto w-fit space-y-1 text-sm">
          <li
            v-for="level in LEVEL_LABELS"
            :key="level.stars"
          >
            {{ level.stars }}： {{ level.text }}
          </li>
        </ul>
      </CardContent>
    </Card>

    <template
      v-for="category in mergedCategories"
      :key="category.id"
    >
      <section
        v-if="category.isChecked"
        class="mt-10"
      >
        <div class="mb-4 flex items-center justify-center gap-2">
          <component
            :is="resolveCategoryIcon(category.key)"
            class="size-8 shrink-0"
            aria-hidden="true"
          />
          <h2 class="text-xl font-bold sm:text-2xl">{{ category.label }}</h2>
        </div>

        <div class="space-y-4">
          <QuestionCard
            v-for="(question, index) in category.questions"
            :key="question.id"
            :question="question"
            :question-number="index + 1"
            @update:answer="
              handleAnswerUpdate(category.id, question.id, $event.answerId, $event.patch)
            "
          />
        </div>
      </section>
    </template>

    <!-- バリデーションエラー表示 -->
    <ValidationError :errors="validationErrors">
      <template #description>
        <p>チェックを入れた項目には、習熟度の選択が必須です。</p>
      </template>
    </ValidationError>

    <!-- 回答0件エラー表示 -->
    <ValidationError
      :errors="[]"
      :show="noAnswersError"
      message-id="no-answers-message"
    >
      <template #description>
        <p>1つ以上の項目に回答してから次へ進んでください</p>
      </template>
    </ValidationError>

    <div class="mt-10 flex flex-col items-center gap-4">
      <p
        v-if="isSubmitDisabled"
        class="submit-hint text-destructive text-center text-sm font-semibold"
      >
        <font-awesome-icon
          icon="fa-solid fa-triangle-exclamation"
          shake
        />
        すべてのチェック項目に習熟度を選択してください
      </p>
      <AnimatedIconButton
        icon="fa-solid fa-arrow-right"
        label="次へ進む"
        animation-type="bounce"
        :inactive="isSubmitDisabled"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.submit-hint {
  animation: pulse 2s infinite;
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
</style>
