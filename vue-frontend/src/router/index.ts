import { createRouter, createWebHashHistory } from 'vue-router';
import TopPage from '@/views/TopPage.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'top',
      component: TopPage,
    },
    {
      path: '/survey',
      name: 'survey',
      component: () => import('@/views/SurveyPage.vue'),
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/views/ResultPage.vue'),
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

export default router;
