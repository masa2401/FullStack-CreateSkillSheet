<script setup lang="ts">
import QuestionCard from '@/components/QuestionCard.vue';
import ValidationError from '@/components/ValidationError.vue';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSurveyStore } from '@/stores/useSurveyStore';
import { useSurveyValidation } from '@/composables/useSurveyValidation';
import { ROUTES, LEVEL_LABELS } from '@/utils/constants';
import type { QuestionState } from '@/types';

const router = useRouter();
const store = useSurveyStore();
const isHovering = ref<boolean>(false);

// ─── ストアからデータを取得 ──────────────────────────────────────────────────

const { userName, categoryData } = storeToRefs(store);

// ─── バリデーション ──────────────────────────────────────────────────────────

const { validationErrors, validate, isSubmitDisabled } = useSurveyValidation(categoryData);

// ─── イベントハンドラ ────────────────────────────────────────────────────────

/**
 * 質問の更新ハンドラ。
 * QuestionCard から @update:question イベントで呼ばれる。
 */
const handleQuestionUpdate = (
  categoryIndex: number,
  questionIndex: number,
  updatedQuestion: QuestionState,
): void => {
  if (categoryData.value[categoryIndex]) {
    categoryData.value[categoryIndex].questions[questionIndex] = updatedQuestion;
  }
};

/** 次へ進む処理 */
const onSubmit = async (): Promise<void> => {
  if (!validate()) {
    await nextTick();
    const target = document.getElementById('error-message');
    target?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  router.push(ROUTES.RESULT);
};
</script>

<template>
  <div class="page-container">
    <div class="header-section">
      <div class="inner">
        <div class="name-card">
          <h2 class="user-greeting">{{ userName }} 様</h2>
        </div>
        <div class="instruction-card">
          <p class="instruction-text">
            <font-awesome-icon icon="fa-solid fa-check" />
            以下の質問で該当する項目を選択後、習熟度を5段階で選択してください。
          </p>
          <div class="description-group">
            <div class="image">
              <img src="../assets/customers.png" alt="" />
            </div>
            <ul class="stars-description">
              <li v-for="level in LEVEL_LABELS" :key="level.stars">
                {{ level.stars }}： {{ level.text }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="wrap">
      <template v-for="(category, categoryIndex) in categoryData" :key="category.id">
        <div v-if="category.isChecked" class="category-section">
          <div class="category-header">
            <font-awesome-icon :icon="category.icon" class="category-icon" />
            <h3 class="category-title">{{ category.genre }}</h3>
          </div>

          <QuestionCard v-for="(question, questionIndex) in category.questions" :key="question.id" :question="question"
            @update:question="handleQuestionUpdate(categoryIndex, questionIndex, $event)" />
        </div>
      </template>

      <!-- バリデーションエラー表示 -->
      <ValidationError :errors="validationErrors">
        <template #description>
          <p class="error-description">チェックを入れた項目には、習熟度の選択が必須です。</p>
        </template>
      </ValidationError>

      <div class="submit-section">
        <p v-if="isSubmitDisabled" class="submit-hint">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" shake />
          すべてのチェック項目に習熟度を選択してください
        </p>
        <button @mouseenter="isHovering = true" @mouseleave="isHovering = false" @click="onSubmit" class="submit-button"
          :class="{ disabled: isSubmitDisabled }" :disabled="isSubmitDisabled">
          次へ進む &ensp;
          <font-awesome-icon icon="fa-solid fa-arrow-right" :bounce="isHovering" />
        </button>
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

.name-card {
  margin-bottom: var(--p-12, 1.5rem);
}

.user-greeting {
  font-size: 1.8rem;
  font-weight: 700;
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

.submit-button {
  font-size: 1rem;
  padding: var(--p-8, 1rem) var(--p-16, 2rem);
  background: #483c32;
  color: #ffffff;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(72, 60, 50, 0.3);
  transition: all 0.3s;
}

.submit-button:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(72, 60, 50, 0.4);
  background: #5a4a3e;
}

.submit-button.disabled {
  background: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
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

  .user-greeting {
    font-size: 1.4rem;
  }

  .stars-description {
    margin-right: 0;
  }

  .image {
    display: none;
  }
}
</style>
