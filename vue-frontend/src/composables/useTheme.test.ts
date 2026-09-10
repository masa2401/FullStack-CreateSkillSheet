import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useTheme } from './useTheme'

const mountWithTheme = () => {
  let api!: ReturnType<typeof useTheme>
  const wrapper = mount({
    setup() {
      api = useTheme()
      return () => null
    },
  })
  return { wrapper, api }
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    document.documentElement.className = ''
  })

  it('toggleTheme で html の dark クラスが付き外しされる', async () => {
    const { wrapper, api } = mountWithTheme()

    api.toggleTheme()
    await wrapper.vm.$nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(api.isDark.value)

    const before = api.isDark.value
    api.toggleTheme()
    await wrapper.vm.$nextTick()
    expect(api.isDark.value).toBe(!before)
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })

  it('選択した配色が localStorage に保存される', async () => {
    const { wrapper, api } = mountWithTheme()

    api.isDark.value = true
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem('vueuse-color-scheme')).toBe('dark')

    api.isDark.value = false
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem('vueuse-color-scheme')).toBe('light')
  })
})
