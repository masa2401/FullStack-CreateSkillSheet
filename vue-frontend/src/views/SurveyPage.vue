<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import ValidationError from '@/components/ValidationError.vue'
import { useMergedSurvey } from '@/composables/useMergedSurvey'
import { useSurveyValidation } from '@/composables/useSurveyValidation'
import { useSurveyStore } from '@/stores/useSurveyStore'
import type { StarLevel } from '@/types'
import { LEVEL_LABELS, ROUTES } from '@/utils/constants'

const router = useRouter()
const store = useSurveyStore()

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

const onSubmit = async (): Promise<void> => {
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
  router.push(ROUTES.RESULT)
}
</script>

<template>
  <div class="page-container">
    <div class="header-section">
      <div class="inner">
        <div class="instruction-card">
          <p class="instruction-text">
            <font-awesome-icon icon="fa-solid fa-check" />
            以下の質問で該当する項目を選択後、習熟度を5段階で選択してください。
          </p>
          <div class="description-group">
            <div class="image">
              <img
                src="../assets/customers.png"
                alt=""
              />
            </div>
            <ul class="stars-description">
              <li
                v-for="level in LEVEL_LABELS"
                :key="level.stars"
              >
                {{ level.stars }}： {{ level.text }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="wrap">
      <template
        v-for="category in mergedCategories"
        :key="category.id"
      >
        <div
          v-if="category.isChecked"
          class="category-section"
        >
          <div class="category-header">
            <font-awesome-icon
              :icon="category.icon"
              class="category-icon"
            />
            <h3 class="category-title">{{ category.label }}</h3>
          </div>

          <QuestionCard
            v-for="question in category.questions"
            :key="question.id"
            :question="question"
            @update:answer="
              handleAnswerUpdate(category.id, question.id, $event.answerId, $event.patch)
            "
          />
        </div>
      </template>

      <!-- バリデーションエラー表示 -->
      <ValidationError :errors="validationErrors">
        <template #description>
          <p class="error-description">チェックを入れた項目には、習熟度の選択が必須です。</p>
        </template>
      </ValidationError>

      <!-- 回答0件エラー表示 -->
      <ValidationError
        :errors="[]"
        :show="noAnswersError"
        message-id="no-answers-message"
      >
        <template #description>
          <p class="error-description">1つ以上の項目に回答してから次へ進んでください</p>
        </template>
      </ValidationError>

      <div class="submit-section">
        <p
          v-if="isSubmitDisabled"
          class="submit-hint"
        >
          <font-awesome-icon
            icon="fa-solid fa-triangle-exclamation"
            shake
          />
          すべてのチェック項目に習熟度を選択してください
        </p>
        <AnimatedIconButton
          animation-type="bounce"
          icon="fa-solid fa-arrow-right"
          label="次へ進む"
          @click="onSubmit"
          :disabled="isSubmitDisabled"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #d3c6a6 0%, #e8dcc8 100%);
  padding: var(--p-24, 3rem) var(--p-8, 1rem) var(--p-16, 2rem);
}

.header-section {
  max-width: 1000px;
  margin: 0 auto var(--p-16, 2rem);
}

.inner {
  color: #483c32;
  max-width: 1000px;
  padding: var(--p-16, 2rem) var(--p-8, 1rem);
  margin: 0 auto;
  background: #ffffff;
  border-radius: var(--radius, 12px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.15);
  border: 1px solid rgba(72, 60, 50, 0.1);
}

.instruction-text {
  margin: 0 0 var(--p-8, 0.5rem);
  font-size: 1.05rem;
  color: #444;
  text-align: center;
  line-height: 1.6;
}

.description-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--p-24, 3rem);
}

.stars-description {
  font-size: 0.95rem;
}

.wrap {
  max-width: 1000px;
  margin: 0 auto;
}

.category-section {
  margin-top: var(--p-16, 2rem);
  background: #ffffff;
  border-radius: var(--radius, 12px);
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
  padding: var(--p-20, 2.5rem) 0;
}

.category-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  padding: var(--p-8, 1rem);
}

.category-icon {
  font-size: 2rem;
  color: #483c32;
}

.category-title {
  font-size: 1.5rem;
  margin: 0;
  color: #483c32;
  font-weight: 700;
}

.submit-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--p-8, 1rem);
  margin-top: var(--p-16, 2rem);
}

.submit-hint {
  color: #c00e0b;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
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

@media (max-width: 768px) {
  .page-container {
    padding: var(--p-8, 1rem);
  }

  .stars-description {
    margin-right: 0;
  }

  .image {
    display: none;
  }
}
</style>
