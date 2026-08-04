import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AnimatedIconButton from './AnimatedIconButton.vue'

describe('AnimatedIconButton', () => {
  it('ラベルが表示される', () => {
    const wrapper = mount(AnimatedIconButton, {
      props: { icon: 'fa-solid fa-check', label: 'テストボタン' },
      stubs: { 'font-awesome-icon': true },
    })
    expect(wrapper.find('.button-text').text()).toBe('テストボタン')
  })

  it('クリック時に click イベントが emit される', async () => {
    const wrapper = mount(AnimatedIconButton, {
      props: { icon: 'fa-solid fa-check', label: 'テストボタン' },
      stubs: { 'font-awesome-icon': true },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
