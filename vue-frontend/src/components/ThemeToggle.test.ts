import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ThemeToggle from './ThemeToggle.vue'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    document.documentElement.className = ''
  })

  it('クリックで配色が切り替わり、aria-pressed が追従する', async () => {
    const wrapper = mount(ThemeToggle)
    const button = wrapper.find('button')
    const before = button.attributes('aria-pressed')

    await button.trigger('click')

    expect(wrapper.find('button').attributes('aria-pressed')).not.toBe(before)
    expect(document.documentElement.classList.contains('dark')).toBe(
      wrapper.find('button').attributes('aria-pressed') === 'true',
    )
  })

  it('現在の配色に応じて aria-label が切り替わる', async () => {
    const wrapper = mount(ThemeToggle)
    const labelBefore = wrapper.find('button').attributes('aria-label')

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('button').attributes('aria-label')).not.toBe(labelBefore)
  })
})
