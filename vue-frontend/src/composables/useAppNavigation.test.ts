import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/utils/constants'

import { useAppNavigation } from './useAppNavigation'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('useAppNavigation', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('goToTop: ROUTES.TOP へ遷移する', () => {
    const { goToTop } = useAppNavigation()
    goToTop()
    expect(push).toHaveBeenCalledWith(ROUTES.TOP)
  })

  it('goToSurvey: ROUTES.SURVEY へ遷移する', () => {
    const { goToSurvey } = useAppNavigation()
    goToSurvey()
    expect(push).toHaveBeenCalledWith(ROUTES.SURVEY)
  })

  it('goToResult: ROUTES.RESULT へ遷移する', () => {
    const { goToResult } = useAppNavigation()
    goToResult()
    expect(push).toHaveBeenCalledWith(ROUTES.RESULT)
  })
})
