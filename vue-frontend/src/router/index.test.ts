import type { RouteLocationNormalized } from 'vue-router'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSurveyStore } from '@/stores/useSurveyStore'
import { ROUTES } from '@/utils/constants'
import * as shareUtils from '@/utils/shareUtils'

import router, { requiresAnswersGuard } from './index'

vi.mock('@/utils/shareUtils')

describe('router', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(shareUtils.getIdFromUrl).mockReturnValue(null)
    vi.mocked(shareUtils.getDataFromUrl).mockReturnValue(null)
  })

  it('/top, /survey, /result, 未定義パスへそれぞれ遷移できる', async () => {
    await router.push(ROUTES.TOP)
    expect(router.currentRoute.value.name).toBe('top')

    await router.push(ROUTES.SURVEY)
    expect(router.currentRoute.value.name).toBe('survey')

    const store = useSurveyStore()
    store.setAnswerSelection(1, 1, 1, { isChecked: true })
    await router.push(ROUTES.RESULT)
    expect(router.currentRoute.value.name).toBe('result')

    await router.push('/no-such-path')
    expect(router.currentRoute.value.name).toBe('NotFound')
  })

  it('scrollBehavior: savedPosition があればそれを返す', () => {
    const saved = { left: 0, top: 120 }
    const result = router.options.scrollBehavior?.(
      router.currentRoute.value,
      router.currentRoute.value,
      saved,
    )
    expect(result).toBe(saved)
  })

  it('scrollBehavior: savedPosition が無ければ { top: 0 } を返す', () => {
    const result = router.options.scrollBehavior?.(
      router.currentRoute.value,
      router.currentRoute.value,
      null,
    )
    expect(result).toEqual({ top: 0 })
  })
})

describe('requiresAnserGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(shareUtils.getIdFromUrl).mockReturnValue(null)
    vi.mocked(shareUtils.getDataFromUrl).mockReturnValue(null)
  })

  const buildTo = (requiresAnswers: boolean): RouteLocationNormalized =>
    ({ meta: { requiresAnswers } }) as unknown as RouteLocationNormalized

  it('回答チェックの対象外のルート（/top・/survey など）では、そのまま遷移できる', () => {
    const next = vi.fn()
    requiresAnswersGuard(buildTo(false), {} as RouteLocationNormalized, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('回答が1件も無い状態で /result にアクセスしようとすると、/top へリダイレクトされる', () => {
    useSurveyStore()
    const next = vi.fn()

    requiresAnswersGuard(buildTo(true), {} as RouteLocationNormalized, next)

    expect(next).toHaveBeenCalledWith(ROUTES.TOP)
  })

  it('回答が1件以上ある状態では、/result にそのまま遷移できる', () => {
    const store = useSurveyStore()
    store.setAnswerSelection(1, 1, 1, { isChecked: true })
    const next = vi.fn()

    requiresAnswersGuard(buildTo(true), {} as RouteLocationNormalized, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('URLに共有リンクのID（id=）が含まれる場合は、回答の有無に関わらず /result に遷移できる', () => {
    vi.mocked(shareUtils.getIdFromUrl).mockReturnValue('shared-id')
    const next = vi.fn()

    requiresAnswersGuard(buildTo(true), {} as RouteLocationNormalized, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('URLに共有データ（data=）が含まれる場合は、回答の有無に関わらず /result に遷移できる', () => {
    vi.mocked(shareUtils.getDataFromUrl).mockReturnValue({ userName: 'x', selections: [] })
    const next = vi.fn()

    requiresAnswersGuard(buildTo(true), {} as RouteLocationNormalized, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('id= を含まない無関係な文字列（例: valid=）では共有リンクとして扱われず、回答が無ければ /top へリダイレクトされる', () => {
    useSurveyStore()
    const next = vi.fn()

    requiresAnswersGuard(buildTo(true), {} as RouteLocationNormalized, next)

    expect(next).toHaveBeenCalledWith(ROUTES.TOP)
  })
})
