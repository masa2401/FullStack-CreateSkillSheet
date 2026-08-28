<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import EditableNameHeading from '@/components/EditableNameHeading.vue'
import ShareButton from '@/components/ShareButton.vue'
import { useMergedSurvey } from '@/composables/useMergedSurvey'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { fetchSheet, isBackendEnabled } from '@/utils/api'
import { LEVEL_LABELS, ROUTES } from '@/utils/constants'
import { getDataFromUrl, getIdFromUrl } from '@/utils/shareUtils'

const router = useRouter()
const store = useSurveyStore()
const { mergedCategories } = useMergedSurvey()

const goToTop = () => router.push(ROUTES.TOP)
const goBack = () => router.push(ROUTES.SURVEY)

const startOwnSheet = (): void => {
  store.reset()
  router.push(ROUTES.TOP)
}

type PageStatus =
  | { type: 'loading' }
  | { type: 'ready'; isSharedView: boolean }
  | { type: 'error'; reason: 'expired' | 'notfound'; expiryDays?: number }

const pageStatus = ref<PageStatus>({ type: 'loading' })

onMounted(async () => {
  const sharedId = getIdFromUrl()
  if (sharedId && isBackendEnabled()) {
    const result = await fetchSheet(sharedId)
    if (result) {
      if (result.status === 'success') {
        store.loadFromSharedState(result.data)
        pageStatus.value = { type: 'ready', isSharedView: true }
        return
      }
      if (result.status === 'expired') {
        pageStatus.value = { type: 'error', reason: result.status, expiryDays: result.expiryDays }
        return
      }
      if (result.status === 'notfound') {
        pageStatus.value = { type: 'error', reason: result.status }
        return
      }
    }
  }

  const urlData = getDataFromUrl()
  if (urlData) {
    store.loadFromSharedState(urlData)
    pageStatus.value = { type: 'ready', isSharedView: true }
    return
  }
  pageStatus.value = { type: 'ready', isSharedView: false }
})

const handleNameCommitted = async (name: string): Promise<void> => {
  store.setUserName(name)
  if (!isBackendEnabled()) return
  try {
    await store.getSavedIdOrSave()
  } catch (error) {
    console.error('プリフェッチ用の保存に失敗しました', error)
  }
}

const displayName = computed(() => store.userName || 'Guest')

// ─── 分岐処理 ──────────────────────────────────────────────────────────────

const displayCategories = computed(() =>
  mergedCategories.value
    .filter((cat) => cat.isChecked)
    .map((cat) => ({
      ...cat,
      questions: cat.questions
        .map((q) => ({
          ...q,
          answers: q.answers.filter((a) => a.isChecked),
        }))
        .filter((q) => q.answers.length > 0),
    }))
    .filter((cat) => cat.questions.length > 0),
)
</script>

<template>
  <div
    class="page-container"
    v-if="pageStatus.type === 'ready'"
  >
    <div class="content-wrapper">
      <div class="header-section">
        <div class="result-header">
          <h2
            v-if="pageStatus.isSharedView"
            class="page-title"
          >
            {{ displayName }} 様のスキルシート
          </h2>
          <EditableNameHeading
            v-else
            :initial-name="store.userName"
            :display-name="displayName"
            @commit="handleNameCommitted"
          />
        </div>
        <div class="description-group">
          <div class="image">
            <img
              src="../assets/mission.png"
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

    <div class="content-wrapper">
      <div
        v-for="category in displayCategories"
        :key="category.id"
        class="category-section"
      >
        <div class="category-header">
          <font-awesome-icon
            :icon="category.icon"
            class="category-icon"
          />
          <h3 class="category-title">{{ category.label }}</h3>
        </div>
        <div
          v-for="question in category.questions"
          :key="question.id"
          class="question-block"
        >
          <h4 class="question-title">{{ question.questionText }}</h4>
          <div class="skills-grid">
            <div
              v-for="answer in question.answers"
              :key="answer.label"
              class="skill-card"
            >
              <div class="skill-info">
                <div class="skill-name">{{ answer.label }}</div>
                <div class="skill-level">
                  <span class="level-stars">{{
                    LEVEL_LABELS[(answer.value ?? 0) - 1]?.stars
                  }}</span>
                  <span class="level-number">&nbsp;({{ answer.value }}/5)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="button-group no-print">
        <template v-if="!pageStatus.isSharedView">
          <AnimatedIconButton
            animationType="beat"
            icon="fa-solid fa-arrow-left"
            label="修正する"
            variant="secondary"
            @click="goBack"
          />

          <ShareButton />

          <AnimatedIconButton
            animationType="beat"
            icon="fa-regular fa-house"
            label="トップへ戻る"
            variant="secondary"
            @click="goToTop"
          />
        </template>

        <template v-else>
          <AnimatedIconButton
            icon="fa-solid fa-pen"
            label="自分のスキルシートを作成"
            @click="startOwnSheet"
          />
        </template>
      </div>
    </div>
  </div>

  <div
    v-else-if="pageStatus.type === 'error'"
    class="error-container"
  >
    <div class="error-content">
      <span class="error-icon">
        <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
      </span>
      <h2 class="error-title">
        {{
          pageStatus.reason === 'expired'
            ? 'リンクの有効期限が切れています'
            : 'リンクが見つかりません'
        }}
      </h2>
      <p class="error-message">
        {{
          pageStatus.reason === 'expired'
            ? `共有リンクの有効期限（${pageStatus.expiryDays}日間）が切れています。`
            : 'お探しのスキルシートは存在しないか、削除された可能性があります。'
        }}
      </p>
      <AnimatedIconButton
        icon="fa-solid fa-house"
        label="トップへ戻る"
        @click="goToTop"
      />
    </div>
  </div>

  <div
    v-else
    class="loading-container"
    role="status"
    aria-label="データを読み込んでいます"
    aria-live="polite"
  >
    <div
      class="loading-spinner"
      aria-hidden="true"
    ></div>
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

.level-number {
  font-size: 0.8em;
  color: #666;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: var(--p-8, 1rem);
  flex-wrap: wrap;
  margin-top: var(--p-24, 3rem);
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

.error-container {
  min-height: 85vh;
  background: linear-gradient(135deg, #d3c6a6 0%, #e8dcc8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--p-32, 4rem);
}

.error-content {
  background: #ffffff;
  border-radius: 20px;
  padding: var(--p-24, 3rem);
  text-align: center;
  max-width: 600px;
  width: 75%;
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.15);
  border: 1px solid rgba(72, 60, 50, 0.1);
}

.error-icon {
  display: block;
  font-size: 3rem;
  color: #b45309;
  margin-bottom: 1rem;
}

.error-title {
  color: #483c32;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.error-message {
  color: #666;
  line-height: 1.7;
  margin: 0 0 2rem;
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
    border: 1px solid #e5e7eb;
    border-radius: var(--radius, 12px);
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
    border: 1.5px solid #d1d5db;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
    border-radius: 0;
    padding: var(--p-8, 1rem) 0;
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
    padding: 0 var(--p-12, 1.5rem) var(--p-16, 2rem);
  }

  .question-title {
    font-size: 1rem;
    margin: 0 0 var(--p-4, 0.5rem);
    break-after: avoid;
    break-inside: avoid;
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
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .skill-info {
    gap: var(--p-8, 1rem);
  }

  .skill-name {
    font-size: 0.9rem;
  }

  .level-stars {
    font-size: 0.9rem;
    color: #1a1a1a !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-weight: 600;
  }

  .level-number {
    color: #444 !important;
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
