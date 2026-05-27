<script setup lang="ts">
import { computed } from 'vue';
import type { ValidationError } from '@/types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  errors: ValidationError[];
}

const props = defineProps<Props>();

// ─── 内部型 ──────────────────────────────────────────────────────────────────

/** カテゴリ × 質問 でグループ化したエラーを表す型 */
interface GroupedError extends ValidationError {
  count: number;
}

// ─── ロジック ────────────────────────────────────────────────────────────────

/**
 * エラーをカテゴリと質問ごとにグループ化する。
 * 同じ (category, text) の組み合わせをまとめ、件数を count に持つ。
 */
const groupedErrors = computed<GroupedError[]>(() => {
  const groups: Record<string, GroupedError> = {};

  props.errors.forEach((error) => {
    const key = `${error.category}|${error.text ?? ''}`;
    if (!groups[key]) {
      groups[key] = {
        category: error.category,
        text: error.text,
        count: 0,
      };
    }
    groups[key].count++;
  });

  return Object.values(groups);
});

/**
 * 質問文の冒頭 30 文字のみ表示する（長い場合は末尾に "..." を付ける）。
 */
const getTextPreview = (text?: string) => {
  if (!text) return '';
  return text.length > 30 ? `${text.substring(0, 30)}...` : text;
};
</script>

<template>
  <transition name="fade">
    <div v-if="errors.length > 0" class="error-message" id="error-message" role="alert" aria-live="assertive">
      <div class="error-content">
        <div class="error-title">
          <div class="error-icon">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
          </div>
          <h4>入力エラー</h4>
        </div>
        <div class="error-text">
          <slot name="description"></slot>
          <ul class="error-list">
            <li v-for="(group, index) in groupedErrors" :key="index" class="error-item">
              <font-awesome-icon icon="fa-solid fa-circle-exclamation" class="error-bullet" />
              <div class="error-details">
                <div class="error-main">
                  <strong>{{ group.category }}</strong>
                  <span class="error-count">（{{ group.count }}件）</span>
                </div>
                <div v-if="group.text" class="error-question">
                  {{ getTextPreview(group.text) }}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.error-message {
  background: #fff5f5;
  border: 2px solid #f88;
  border-radius: var(--radius, 12px);
  padding: var(--p-16, 2rem);
  margin-top: var(--p-16, 2rem);
  display: flex;
  gap: var(--p-4, 0.5rem);
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.15);
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

.error-icon {
  color: #ef4444;
  font-size: 2rem;
  flex-shrink: 0;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: var(--p-8, 1rem);
  color: #c00;
}

.error-title {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--p-4, 0.5rem);
}

.error-title>h4 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.error-text {
  width: 100%;
  text-align: center;
}

.error-list {
  width: fit-content;
  margin: var(--p-8, 1rem) auto 0;
  padding: 0;
  list-style: none;
}

.error-item {
  display: flex;
  align-items: baseline;
  width: fit-content;
  padding: var(--p-4, 0.5rem);
  line-height: 1.4;
}

.error-bullet {
  color: #ef4444;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.error-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.error-main strong {
  font-weight: 700;
}

.error-count {
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
}

.error-question {
  color: #666;
  font-size: 0.85rem;
  margin-left: 0;
  line-height: 1.3;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .error-message {
    padding: var(--p-12, 1.5rem);
  }

  .error-icon {
    font-size: 1.5rem;
  }

  .error-title>h4 {
    font-size: 1.2rem;
  }

  .error-item {
    font-size: 0.9rem;
  }
}
</style>
