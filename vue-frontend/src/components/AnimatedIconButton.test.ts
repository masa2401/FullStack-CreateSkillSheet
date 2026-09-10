import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import AnimatedIconButton from './AnimatedIconButton.vue'

const baseProps = { icon: 'fa-solid fa-check', label: 'テストボタン' }

const renderButton = (attrs: Record<string, unknown> = {}) =>
  render(AnimatedIconButton, {
    props: baseProps,
    attrs,
    global: { stubs: { 'font-awesome-icon': true } },
  })

const button = () => screen.getByRole('button', { name: 'テストボタン' })

describe('AnimatedIconButton', () => {
  it('label がボタンのアクセシブル名になる', () => {
    renderButton()
    expect(button()).toBeInTheDocument()
  })

  it('親が渡した click ハンドラがネイティブイベント付きで呼ばれる', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderButton({ onClick })

    await user.click(button())

    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick.mock.calls[0]?.[0]).toMatchObject({ type: 'click' })
  })

  it('aria-disabled 属性が実際の button 要素まで到達する（非ゲスト時は "false"）', () => {
    renderButton({ 'aria-disabled': false })
    expect(button()).toHaveAttribute('aria-disabled', 'false')
  })

  it('aria-disabled="true" を渡すと button 要素まで到達する', () => {
    renderButton({ 'aria-disabled': true })
    expect(button()).toHaveAttribute('aria-disabled', 'true')
  })
})
