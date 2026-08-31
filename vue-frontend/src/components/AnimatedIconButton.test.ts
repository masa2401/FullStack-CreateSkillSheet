import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AnimatedIconButton from './AnimatedIconButton.vue'

const baseProps = { icon: 'fa-solid fa-check', label: 'テストボタン' }

describe('AnimatedIconButton', () => {
  it('ラベルが表示される', () => {
    const wrapper = mount(AnimatedIconButton, {
      props: baseProps,
      stubs: { 'font-awesome-icon': true },
    })
    expect(wrapper.find('.button-text').text()).toBe('テストボタン')
  })

  it('親が渡した click ハンドラがネイティブイベント付きで呼ばれる', async () => {
    const onClick = vi.fn()
    const wrapper = mount(AnimatedIconButton, {
      props: baseProps,
      attrs: { onClick },
      stubs: { 'font-awesome-icon': true },
    })

    await wrapper.find('button').trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick.mock.calls[0]?.[0]).toMatchObject({ type: 'click' })
  })

  it('aria-disabled 属性が実際の button 要素まで到達する（非ゲスト時は "false"）', () => {
    const wrapper = mount(AnimatedIconButton, {
      props: baseProps,
      attrs: { 'aria-disabled': false },
      stubs: { 'font-awesome-icon': true },
    })
    expect(wrapper.find('button').attributes('aria-disabled')).toBe('false')
  })

  it('aria-disabled="true" を渡すと button 要素まで到達する', () => {
    const wrapper = mount(AnimatedIconButton, {
      props: baseProps,
      attrs: { 'aria-disabled': true },
      stubs: { 'font-awesome-icon': true },
    })
    expect(wrapper.find('button').attributes('aria-disabled')).toBe('true')
  })
})
