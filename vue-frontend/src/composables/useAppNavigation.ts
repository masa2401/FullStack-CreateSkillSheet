import { useRouter } from 'vue-router'

import { ROUTES } from '@/utils/constants'

export function useAppNavigation() {
  const router = useRouter()

  const goToTop = () => router.push(ROUTES.TOP)
  const goToSurvey = () => router.push(ROUTES.SURVEY)
  const goToResult = () => router.push(ROUTES.RESULT)

  return { goToTop, goToSurvey, goToResult }
}
