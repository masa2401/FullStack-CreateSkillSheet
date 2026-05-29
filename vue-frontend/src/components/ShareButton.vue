<script setup lang="ts">
import AnimatedIconButton from '@/components/AnimatedIconButton.vue';
import { ref, computed } from 'vue';
import { createShareUrl, copyToClipboard } from '@/utils/shareUtils';
import { downloadCSV } from '@/utils/csvUtils';
import type { SurveyData } from '@/types';

interface Props {
  surveyData: SurveyData;
}

const props = defineProps<Props>();
const showMenu = ref<boolean>(false);
const copySuccess = ref<boolean>(false);
const downloadSuccess = ref<boolean>(false);

// 共有URLを生成
const shareUrl = computed((): string => {
  try {
    return createShareUrl(props.surveyData);
  } catch (error) {
    console.error('URL生成エラー:', error);
    return '';
  }
});

// クリップボードにコピー
const handleCopy = async () => {
  const success = await copyToClipboard(shareUrl.value);
  if (success) {
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
      showMenu.value = false;
    }, 2000);
  }
};

// CSVダウンロード
const handleDownloadCSV = () => {
  const success = downloadCSV(props.surveyData);
  if (success) {
    downloadSuccess.value = true;
    setTimeout(() => {
      downloadSuccess.value = false;
      showMenu.value = false;
    }, 2000);
  } else {
    console.log('CSVのダウンロードに失敗しました');
  }
};

// メニューの表示切替
const toggleMenu = () => {
  showMenu.value = !showMenu.value;
  // メニューを開いた時に成功状態をリセット
  if (showMenu.value) {
    copySuccess.value = false;
    downloadSuccess.value = false;
  }
};
</script>

<template>
  <div class="share-button-container">
    <AnimatedIconButton icon="fa-solid fa-arrow-up-right-from-square" label="結果を共有" :aria-expanded="showMenu"
      aria-haspopup="true" animationType="bounce" button-class="share-button" @click="toggleMenu" />

    <transition name="slide-fade">
      <div v-if="showMenu" class="share-menu">
        <button @click="handleCopy" class="menu-item" :class="{ success: copySuccess }">
          <span class="menu-icon" v-if="copySuccess">
            <font-awesome-icon icon="fa-solid fa-check" />
          </span>
          <span class="menu-icon" v-else>
            <font-awesome-icon icon="fa-regular fa-copy" />
          </span>
          <span class="menu-text">{{ copySuccess ? 'コピー完了' : 'URLをコピー' }}</span>
        </button>

        <button @click="handleDownloadCSV" class="menu-item" :class="{ success: downloadSuccess }">
          <span class="menu-icon" v-if="downloadSuccess">
            <font-awesome-icon icon="fa-solid fa-check" />
          </span>
          <span class="menu-icon" v-else>
            <font-awesome-icon icon="fa-solid fa-file-csv" />
          </span>
          <span class="menu-text">{{ downloadSuccess ? 'DownLoad完了' : 'CSV保存' }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.share-button-container {
  position: relative;
}

.share-button {
  height: 100%;
  padding: var(--p-8, 1rem) var(--p-16, 2rem);
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: #ffffff;
  color: #483c32;
  border-color: #483c32;
  box-shadow: 0 2px 8px rgba(72, 60, 50, 0.1);
  display: inline-flex;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  white-space: nowrap;
}

.share-button:hover {
  background: #483c32;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.25);
}

.share-menu {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(72, 60, 50, 0.15);
  border: 1px solid #483c32;
  padding: var(--p-4, 0.5rem);
  min-width: 200px;
  z-index: 100;
}

.menu-item {
  width: 100%;
  padding: var(--p-8, 1rem);
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: var(--p-4, 0.5rem);
  border-radius: 10px;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 600;
  color: #483c32;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.success {
  background: #d1fae5;
  color: #059669;
}

.menu-icon {
  font-size: 1rem;
}

.menu-text {
  text-align: left;
}

/* アニメーション */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateX(-50%) translateY(10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-50%) translateY(10px);
  opacity: 0;
}

@media (max-width: 768px) {
  .share-button {
    width: 100%;
    justify-content: center;
  }

  .share-menu {
    left: 0;
    right: 0;
    transform: none;
    margin: 0 var(--p-8, 1rem);
  }
}
</style>
