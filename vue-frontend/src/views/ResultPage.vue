<script setup lang="ts">
import ShareButton from '@/components/ShareButton.vue';
import AnimatedIconButton from '@/components/AnimatedIconButton.vue';
import { ROUTES, LEVEL_LABELS } from '@/utils/constants';
import { getDataFromUrl } from '@/utils/shareUtils';
import { useSurveyStore } from '@/stores/useSurveyStore';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { SurveyData, Answer } from '@/types';

const router = useRouter();
const store = useSurveyStore();
const isSharedView = ref<boolean>(false);
const surveyData = ref<SurveyData | null>(null);

// ─── データ取得 ──────────────────────────────────────────────────────────────

onMounted((): void => {
  const urlData = getDataFromUrl();
  if (urlData) {
    surveyData.value = urlData;
    isSharedView.value = true;
    return;
  }

  surveyData.value = store.surveyData;
  isSharedView.value = false;
});

/**
 * チェックされた回答のみ返す。
 */
const getCheckedAnswers = (answers: Answer[]): Answer[] => {
  return answers.filter((answer) => answer.isChecked);
};

// ─── 分岐処理 ──────────────────────────────────────────────────────────────

const displayCategories = computed(() =>
  (surveyData.value?.categories ?? [])
    .filter((cat) => cat.isChecked)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.map((q) => ({
        ...q,
        answers: getCheckedAnswers(q.answers),
      })).filter((q) => q.answers.length > 0),
    })));

// ─── イベントハンドラ ────────────────────────────────────────────────────────

const goToTop = (): void => {
  router.push(ROUTES.TOP);
};

const goBack = (): void => {
  router.push(ROUTES.SURVEY);
};

const handlePrint = (): void => {
  window.print();
};
</script>

<template>
  <div class="page-container" v-if="surveyData">
    <div class="content-wrapper">
      <div class="header-section">
        <div class="result-header">
          <div class="header-icon">
            <font-awesome-icon icon="fa-regular fa-clipboard" />
          </div>
          <h2 class="page-title">{{ surveyData.userName }} 様のスキルシート</h2>
        </div>
        <div class="description-group">
          <div class="image">
            <img src="../assets/mission.png" alt="" />
          </div>
          <ul class="stars-description">
            <li v-for="level in LEVEL_LABELS" :key="level.stars">
              {{ level.stars }}： {{ level.text }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-for="category in displayCategories" :key="category.id" v-show="category.isChecked"
        class="category-section">
        <div class="category-header">
          <font-awesome-icon :icon="category.icon" class="category-icon" />
          <h3 class="category-title">{{ category.genre }}</h3>
        </div>
        <div v-for="question in category.questions" :key="question.id" class="question-block">
          <h4 class="question-title">{{ question.questionText }}</h4>
          <div class="skills-grid">
            <div v-for="answer in question.answers" :key="answer.label" class="skill-card">
              <div class="skill-info">
                <div class="skill-name">{{ answer.label }}</div>
                <div class="skill-level">
                  <span class="level-stars">{{ LEVEL_LABELS[(answer.value ?? 0) - 1]?.stars }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="button-group no-print">
        <template v-if="!isSharedView">
          <AnimatedIconButton icon="fa-solid fa-arrow-left" label="修正する" animationType="beat"
            button-class="action-button secondary-button" @click="goBack" />

          <AnimatedIconButton icon="fa-solid fa-print" label="印刷する" animationType="bounce"
            button-class="action-button print-button" @click="handlePrint" />

          <ShareButton :surveyData="surveyData" />

          <AnimatedIconButton icon="fa-regular fa-house" label="トップへ戻る" animationType="beat"
            button-class="action-button primary-button" @click="goToTop" />
        </template>

        <template v-else>
          <button @click="goToTop" class="action-button primary-button">
            <span class="button-icon">
              <font-awesome-icon icon="fa-solid fa-pen" />
            </span>
            <span class="button-text">自分のスキルシートを作成</span>
          </button>
        </template>
      </div>
    </div>
  </div>

  <div v-else class="loading-container" role="status" aria-label="データを読み込んでいます" aria-live="polite">
    <div class="loading-spinner" aria-hidden="true"></div>
    <p class="loading-text">データを読み込んでいます...</p>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #d3c6a6 0%, #e8dcc8 100%);
  padding: var(--p-24, 3rem) 0;
}

.header-section {
  background: #ffffff;
  border-radius: var(--radius, 12px);
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
  padding: 0;
}

.result-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  background: #ffffff;
  border-radius: var(--radius, 12px);
  padding: var(--p-16, 2rem);
}

.description-group {
  display: flex;
  justify-content: center;
  gap: var(--p-24, 3rem);
  padding-bottom: var(--p-16, 2rem);
}

.stars-description {
  display: flex;
  flex-direction: column;
  width: fit-content;
}

.header-icon {
  font-size: 2.4rem;
}

.page-title {
  font-size: 2.5rem;
  color: #483c32;
  margin: 0;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(211, 198, 166, 0.3);
}

.content-wrapper {
  max-width: 1000px;
  margin: var(--p-20, 2.5rem) auto 0;
  padding: 0 var(--p-8, 1rem);
}

.category-section {
  background: #ffffff;
  border-radius: var(--radius, 12px);
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
  margin-bottom: var(--p-12, 1.5rem);
}

.category-header {
  color: #483c32;
  padding: var(--p-16, 2rem);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--p-4, 0.5rem);
}

.category-icon {
  font-size: 2rem;
}

.category-title {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 700;
}

.question-block {
  padding: 0 var(--p-24, 3rem) var(--p-20, 2.5rem);
}

.question-title {
  font-size: 1.1rem;
  color: #483c32;
  margin: 0 0 var(--p-8, 1rem);
  font-weight: 600;
  line-height: 1.6;
}

.skills-grid {
  display: grid;
  gap: var(--p-12, 1.5rem);
}

.skill-card {
  background: #ffffff;
  padding: var(--p-4, 0.5rem) var(--p-8, 1rem);
  border-left: 4px solid #d3c6a6;
  transition: all 0.3s;
}

.skill-info {
  display: grid;
  grid-template-columns: 9fr 1fr;
  justify-content: space-between;
  align-items: center;
  gap: var(--p-8, 1rem);
}

.skill-name {
  flex: 1;
  color: #483c32;
  font-size: 1rem;
  font-weight: 500;
}

.skill-level {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.level-stars {
  color: #fbbf24;
  font-size: 1.2rem;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: var(--p-8, 1rem);
  flex-wrap: wrap;
  margin-top: var(--p-24, 3rem);
}

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
}

.button-icon {
  font-size: 1.1rem;
  display: inline-block;
}

.button-text {
  display: inline-block;
}

.primary-button {
  background: #483c32;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(72, 60, 50, 0.3);
}

.primary-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(72, 60, 50, 0.4);
  background: #5a4a3e;
  border-color: #5a4a3e;
}

.secondary-button,
.print-button {
  background: #ffffff;
  color: #483c32;
  border-color: #483c32;
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
}

.secondary-button:hover,
.print-button:hover {
  background: #483c32;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.25);
}

.loading-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #d3c6a6 0%, #e8dcc8 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--p-16, 2rem);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(72, 60, 50, 0.3);
  border-top-color: #483c32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #483c32;
  font-size: 1.2rem;
  font-weight: 600;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .image {
    display: none;
  }

  .category-header {
    padding: var(--p-8, 1rem);
  }

  .question-block {
    padding: var(--p-8, 1rem);
  }

  .skill-info {
    flex-direction: column;
    align-items: center;
    gap: var(--p-4, 0.5rem);
  }

  .skill-level {
    width: 100%;
    justify-content: space-between;
  }

  .button-group {
    flex-direction: column;
    width: 100%;
    gap: var(--p-4, 0.5rem);
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}

/* 印刷用スタイル */
@media print {
  @page {
    size: A4;
    margin: 15mm 10mm;
  }

  .no-print,
  .button-group {
    display: none !important;
  }

  .page-container {
    background: #ffffff !important;
    padding: 0;
    min-height: auto;
  }

  .header-section {
    padding: 0 0 var(--p-8, 1rem) 0;
  }

  .header-icon {
    font-size: 2.5rem;
    margin-bottom: var(--p-4, 0.5rem);
  }

  .page-title {
    font-size: 1.8rem;
    text-shadow: none;
    break-after: avoid;
  }

  .content-wrapper {
    padding: 0;
    max-width: 100%;
  }

  .category-section {
    margin-bottom: var(--p-12, 1.5rem);
    box-shadow: none;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius, 12px);
  }

  .category-header {
    padding: var(--p-8, 1rem);
    margin-bottom: var(--p-4, 0.5rem);
  }

  .category-icon {
    font-size: 1.75rem;
  }

  .category-title {
    font-size: 1.3rem;
  }

  .question-block {
    padding: 0 var(--p-12, 1.5rem) var(--p-8, 1rem);
  }

  .question-title {
    font-size: 1rem;
    margin: 0 0 var(--p-4, 0.5rem);
    break-after: avoid;
  }

  .skills-grid {
    gap: var(--p-4, 0.5rem);
  }

  .skill-card {
    padding: var(--p-8, 1rem);
    border-radius: var(--radius, 12px);
    box-shadow: none;
    border: 1px solid #e5e7eb;
    break-inside: avoid;
  }

  .skill-info {
    gap: var(--p-8, 1rem);
  }

  .skill-name {
    font-size: 0.9rem;
  }

  .level-stars {
    font-size: 0.9rem;
  }

  .skill-card {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h2,
  h3,
  h4 {
    break-after: avoid;
  }

  a[href]:after {
    content: none !important;
  }
}
</style>
