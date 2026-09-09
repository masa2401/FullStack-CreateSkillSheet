import { createMemoryHistory, createRouter } from 'vue-router'

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/utils/constants'

import TheHeader from './TheHeader.vue'

const buildRouter = async (initialPath = '/') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/survey', component: { template: '<div />' } },
    ],
  })
  await router.push(initialPath)
  return router
}

const renderHeader = (router: Awaited<ReturnType<typeof buildRouter>>) =>
  render(TheHeader, { global: { plugins: [router] } })

describe('TheHeader', () => {
  it('タイトルが表示される', async () => {
    const router = await buildRouter()
    renderHeader(router)

    expect(
      screen.getByRole('button', { name: 'スキルシート制作ページ（TOPページ）' }),
    ).toBeInTheDocument()
    expect(screen.getByText('スキルシート制作ページ')).toBeInTheDocument()
  })

  it('トップページ以外でタイトルをクリックするとトップへ遷移する', async () => {
    const user = userEvent.setup()
    const router = await buildRouter('/survey')
    renderHeader(router)

    await user.click(
      screen.getByRole('button', { name: 'スキルシート制作ページ（トップページへ戻る）' }),
    )

    await waitFor(() => expect(router.currentRoute.value.path).toBe(ROUTES.TOP))
  })

  it('トップページでタイトルをクリックしても push は呼ばれない', async () => {
    const user = userEvent.setup()
    const router = await buildRouter()
    const pushSpy = vi.spyOn(router, 'push')
    renderHeader(router)

    await user.click(screen.getByRole('button', { name: 'スキルシート制作ページ（TOPページ）' }))

    expect(pushSpy).not.toHaveBeenCalled()
  })
})
