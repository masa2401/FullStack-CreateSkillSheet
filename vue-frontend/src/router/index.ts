import { createRouter, createWebHashHistory } from 'vue-router'

import { useSurveyStore } from '@/stores/useSurveyStore'
import { ROUTES } from '@/utils/constants'
import TopPage from '@/views/TopPage.vue'

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
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// ─── ナビゲーションガードの設定 ──────────────────────────────────────────
router.beforeEach((to, from, next) => {
  if (to.meta.requiresName) {
    const hash = window.location.hash
    const hasSharedData = hash.includes('data=') || hash.includes('id=')
    if (hasSharedData) {
      next()
      return
    }
    const store = useSurveyStore()
    if (!store.userName || store.userName.trim() === '') {
      next(ROUTES.TOP)
      return
    }
  }
  next()
})

export default router
