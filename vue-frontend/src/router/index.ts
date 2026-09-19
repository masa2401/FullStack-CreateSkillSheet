import { type NavigationGuard, createRouter, createWebHashHistory } from 'vue-router'

import { useSurveyStore } from '@/stores/useSurveyStore'
import { ROUTES } from '@/utils/constants'
import { getDataFromQuery, getIdFromQuery } from '@/utils/shareUtils'
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
    },
    {
      path: ROUTES.RESULT,
      name: 'result',
      component: () => import('@/views/ResultPage.vue'),
      meta: { requiresAnswers: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// ─── ナビゲーションガードの設定 ──────────────────────────────────────────
export const requiresAnswersGuard: NavigationGuard = (to, _from, next) => {
  if (to.meta.requiresAnswers) {
    if (getIdFromQuery(to.query) || getDataFromQuery(to.query)) {
      next()
      return
    }
    const store = useSurveyStore()
    if (!store.hasAnswers) {
      next(ROUTES.TOP)
      return
    }
  }
  next()
}
router.beforeEach(requiresAnswersGuard)

export default router
