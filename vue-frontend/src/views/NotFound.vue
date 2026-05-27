<script setup lang="ts">
import AnimatedIconButton from '@/components/AnimatedIconButton.vue';
import { useRouter } from 'vue-router';
import { ROUTES } from '@/utils/constants';

const router = useRouter();

const goToTop = () => {
  router.push(ROUTES.TOP);
};
</script>

<template>
  <div class="notfound-container">
    <div class="notfound-content">
      <div>
        <span class="error-icon"><font-awesome-icon icon="fa-solid fa-magnifying-glass" bounce /></span>
        <h2 class="error-code">404</h2>
      </div>
      <h3 class="error-title">ページが見つかりません</h3>
      <p class="error-message">
        お探しのページは存在しないか、<br />
        移動または削除された可能性があります。
      </p>
      <AnimatedIconButton icon="fa-regular fa-house" label="トップへ戻る" animation="bounce"
        button-class="action-button primary-button" @click="goToTop" />
    </div>
  </div>
</template>

<style scoped>
.notfound-container {
  min-height: 85vh;
  background: linear-gradient(135deg, #d3c6a6 0%, #e8dcc8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--p-32, 4rem);
}

.notfound-content {
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
  font-size: 5rem;
  color: #483c32;
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  margin: 0;
  color: #483c32;
}

.error-title {
  font-size: 1.8rem;
  color: #483c32;
  margin: var(--p-8, 1rem) 0;
  font-weight: 700;
}

.error-message {
  color: #666;
  font-size: 1rem;
  line-height: 1.8;
  margin: var(--p-8, 1rem) 0 var(--p-16, 2rem);
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

@media (max-width: 768px) {
  .notfound-content {
    padding: var(--p-16, 2rem);
  }

  .error-code {
    font-size: 4rem;
  }

  .error-title {
    font-size: 1.5rem;
  }
}
</style>
