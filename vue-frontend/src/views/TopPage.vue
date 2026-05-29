<script setup lang="ts">
import ValidationError from '@/components/ValidationError.vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNameValidation } from '@/composables/useNameValidation';
import { CATEGORIES, ROUTES } from '@/utils/constants';
import { CATEGORY_META } from '@/data/questions';
import { useSurveyStore } from '@/stores/useSurveyStore';

const router = useRouter();
const store = useSurveyStore();
const isHovering = ref<boolean>(false);
const { label: engineerLabel, description: engineerDescription } = CATEGORY_META.engineer;
const { label: designerLabel, description: designerDescription } = CATEGORY_META.designer;

// ─── フォームデータ ──────────────────────────────────────────────────────────

const userName = ref<string>(store.userName);
const engineerChecked = computed({
  get: () => store.isEngineerSelected,
  set: (val: boolean) => store.setCategoryChecked(CATEGORIES.ENGINEER.id, val)
})
const designerChecked = computed({
  get: () => store.isDesignerSelected,
  set: (val: boolean) => store.setCategoryChecked(CATEGORIES.DESIGNER.id, val)
})

// ─── バリデーション ──────────────────────────────────────────────────────────

const { validationErrors, validate, onInput } = useNameValidation(userName);

// ─── イベントハンドラ ────────────────────────────────────────────────────────

/** アンケート開始処理 */
const validateAndProceed = (): void => {
  if (!validate()) return;
  store.setUserName(userName.value.trim()) // setStorageValue → ストアのアクション
  router.push(ROUTES.SURVEY);
};
</script>

<template>
  <div class="page-container">
    <div class="main-content">
      <div class="welcome-card">
        <p class="card-description">
          これからいくつかの質問を行います。<br />
          質問に回答後、あなたのスキルシートが出力されます。
        </p>
      </div>
      <div class="input-group">
        <div class="input-section">
          <label class="input-label" for="name-input">
            <span class="label-icon">
              <font-awesome-icon icon="fa-solid fa-pen" />
            </span>
            お名前を入力してください
          </label>
          <input type="text" id="name-input" class="name-input" :class="{ 'input-error': validationErrors.length > 0 }"
            v-model="userName" placeholder="お名前を入力" @input="onInput" />
        </div>

        <div class="category-section">
          <h3 class="section-title">
            <span class="title-icon">
              <font-awesome-icon icon="fa-regular fa-hand-pointer" />
            </span>
            該当するカテゴリを選択してください(複数選択可)
          </h3>
          <div class="category-cards">
            <label class="category-card" :class="{ active: engineerChecked }">
              <input type="checkbox" class="category-checkbox" v-model="engineerChecked"
                aria-describedby="engineer-desc" />
              <div class="card-content">
                <div class="card-icon-large">
                  <font-awesome-icon icon="fa-solid fa-computer" />
                </div>
                <h4 class="card-category-title">{{ engineerLabel }}</h4>
                <p id="engineer-desc" class="card-category-desc">
                  {{ engineerDescription }}
                </p>
                <div class="check-indicator">
                  <span v-if="engineerChecked" class="check-mark">
                    <font-awesome-icon icon="fa-solid fa-check" />
                  </span>
                </div>
              </div>
            </label>
            <label class="category-card" :class="{ active: designerChecked }">
              <input type="checkbox" class="category-checkbox" v-model="designerChecked"
                aria-describedby="designer-desc" />
              <div class="card-content">
                <div class="card-icon-large">
                  <font-awesome-icon icon="fa-solid fa-palette" />
                </div>
                <h4 class="card-category-title">{{ designerLabel }}</h4>
                <p id="designer-desc" class="card-category-desc">{{ designerDescription }}</p>
                <div class="check-indicator">
                  <span v-if="designerChecked" class="check-mark">
                    <font-awesome-icon icon="fa-solid fa-check" />
                  </span>
                </div>
              </div>
            </label>
          </div>
          <p class="hint-text">
            <font-awesome-icon icon="fa-regular fa-lightbulb" />
            どちらも選択しない場合は、共通の質問のみ表示されます
          </p>
        </div>
      </div>

      <!-- バリデーションエラー表示 -->
      <ValidationError :errors="validationErrors">
        <template #description>
          <p class="error-description">必須項目を入力してください。</p>
        </template>
      </ValidationError>

      <div class="button-section">
        <button @click="validateAndProceed" class="start-button" @mouseenter="isHovering = true"
          @mouseleave="isHovering = false">
          アンケートを開始 &ensp;
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
}

.main-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--p-24, 3rem) var(--p-8, 1rem);
}

.welcome-card {
  background: #ffffff;
  border-radius: var(--radius, 12px);
  padding: var(--p-12, 1.5rem);
  text-align: center;
  margin-bottom: var(--p-16, 2rem);
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.15);
  border: 1px solid rgba(219, 214, 211, 0.1);
}

.card-description {
  color: #666;
  font-size: 1.2rem;
  line-height: 1.8;
  margin: 0;
}

.input-group {
  background: #ffffff;
  border-radius: var(--radius, 12px);
  padding: var(--p-16, 2rem) var(--p-20, 2.5rem);
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
}

.input-section {
  text-align: center;
  margin-bottom: var(--p-16, 2rem);
}

.input-label {
  display: block;
  font-size: 1.2rem;
  color: #483c32;
  margin-bottom: var(--p-4, 0.5rem);
  font-weight: 600;
}

.label-icon {
  font-size: 1.2rem;
}

.name-input {
  width: 75%;
  padding: var(--p-8, 1rem);
  font-size: 1.2rem;
  border: 2px solid #d3c6a6;
  border-radius: var(--radius, 12px);
  transition: all 0.3s;
  box-sizing: border-box;
  background: #ffffff;
}

.name-input:focus {
  outline: none;
  border-color: #483c32;
  box-shadow: 0 0 0 4px rgba(72, 60, 50, 0.1);
}

.name-input.input-error {
  border-color: #f88;
  animation: shake 0.5s ease;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

.section-title {
  font-size: 1.2rem;
  color: #483c32;
  margin: 0 0 var(--p-4, 0.5rem);
  font-weight: 700;
  text-align: center;
}

.title-icon {
  font-size: 1.5rem;
}

.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--p-8, 1rem);
  margin-bottom: var(--p-12, 1.5rem);
}

.category-card {
  position: relative;
  background: #ffffff;
  border: 3px solid #d3c6a6;
  border-radius: var(--radius, 12px);
  padding: var(--p-16, 2rem);
  cursor: pointer;
  transition: all 0.3s;
  display: block;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(72, 60, 50, 0.15);
  border-color: #483c32;
}

.category-card.active {
  background: linear-gradient(135deg, #483c32 0%, #5a4a3e 100%);
  border-color: #483c32;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(72, 60, 50, 0.3);
}

.category-card:focus-within {
  outline: 3px solid #483c32;
  outline-offset: 2px;
}

.category-card.active .card-category-title,
.category-card.active .card-category-desc,
.category-card.active .card-icon-large {
  color: #ffffff;
}

.category-checkbox {
  display: none;
}

.card-content {
  text-align: center;
}

.card-icon-large {
  color: #483c32;
  font-size: 3.5rem;
  margin-bottom: var(--p-8, 1rem);
}

.card-category-title {
  font-size: 1.3rem;
  color: #483c32;
  margin: 0 0 var(--p-4, 0.5rem);
  font-weight: 700;
}

.card-category-desc {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.check-indicator {
  position: absolute;
  top: var(--p-8, 1rem);
  right: var(--p-8, 1rem);
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.15);
}

.check-mark {
  font-size: 1.5rem;
  color: #22c55e;
  font-weight: bold;
  animation: checkPop 0.3s ease;
}

@keyframes checkPop {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.hint-text {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.6;
}

.button-section {
  display: flex;
  justify-content: center;
}

.start-button {
  font-size: 1rem;
  padding: var(--p-8, 1rem) var(--p-16, 2rem);
  margin-top: var(--p-24, 3rem);
  background: #483c32;
  color: #ffffff;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 6px 16px rgba(72, 60, 50, 0.3);
  transition: all 0.3s;
}

.start-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(72, 60, 50, 0.4);
  background: #5a4a3e;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .emoji {
    font-size: 2.5rem;
  }

  .category-cards {
    grid-template-columns: 1fr;
  }

  .welcome-card,
  .input-group {
    padding: var(--p-12, 1.5rem);
  }
}
</style>
