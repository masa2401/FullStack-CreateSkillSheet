import { createRouter, createWebHashHistory } from 'vue-router';
import TopPage from '@/views/TopPage.vue';
import { useSurveyStore } from '@/stores/useSurveyStore';
import { ROUTES } from '@/utils/constants';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: ROUTES.TOP,
      name: 'top',
      component: TopPage,
    },
    {
      path: ROUTES.SURVEY,
      name: 'survey',
      component: () => import('@/views/SurveyPage.vue'),
      meta: { requiresName: true },
    },
    {
      path: ROUTES.RESULT,
      name: 'result',
      component: () => import('@/views/ResultPage.vue'),
      meta: { requiresName: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// ─── ナビゲーションガードの設定 ──────────────────────────────────────────
router.beforeEach((to, from, next) => {
  // メタフィールドに `requiresName` が指定されているページかチェック
  if (to.meta.requiresName) {
    const store = useSurveyStore();
    // ストアの名前が空、または空白のみの場合はTopページへ強制リダイレクト
    if (!store.userName || store.userName.trim() === '') {
      next(ROUTES.TOP);
      return;
    }
  }
  next();
});

export default router;
