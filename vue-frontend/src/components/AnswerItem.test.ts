import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AnswerItem from '@/components/AnswerItem.vue'
import type { StarLevel } from '@/types'

const createWrapper = (
  propsOverrides: {
    answerId?: number
    label?: string
    isChecked?: boolean
    value?: StarLevel
  } = {},
) =>
  mount(AnswerItem, {
    props: {
      answerId: 1,
      label: 'テスト回答',
      isChecked: false,
      value: undefined,
      ...propsOverrides,
    },
    global: { stubs: { 'font-awesome-icon': true } },
  })

describe('AnswerItem.vue', () => {
  it('isChecked が true のとき習熟度選択が表示される', () => {
    const wrapper = createWrapper({ isChecked: true })
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
  })

  it('isChecked が false のとき習熟度選択が表示されない', () => {
    const wrapper = createWrapper({ isChecked: false })
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
  })

  it('チェックボックスの状態が isChecked と対応する', () => {
    const wrapper = createWrapper({ isChecked: true })
    expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('true')
  })

  it('チェックボックス操作時に update:answer が emit される', async () => {
    const wrapper = createWrapper({ isChecked: false })
    await wrapper.find('[role="checkbox"]').trigger('click')

    const emitted = wrapper.emitted('update:answer')
    expect(emitted).toBeTruthy()

    const [payload] = emitted![0] as [{ answerId: number; patch: { isChecked: boolean } }]
    expect(payload.patch.isChecked).toBe(true)
  })

  it('習熟度ボタンを選択すると value が更新される', async () => {
    const wrapper = createWrapper({ isChecked: true, value: undefined })
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(5)

    await radios[2]!.trigger('click')

    const emitted = wrapper.emitted('update:answer')
    expect(emitted).toBeTruthy()

    const [payload] = emitted![0] as [{ answerId: number; patch: { value: number } }]
    expect(payload.patch.value).toBe(3)
  })

  it('選択済みの習熟度に aria-checked が付く', () => {
    const wrapper = createWrapper({ isChecked: true, value: 3 })
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios[2]!.attributes('aria-checked')).toBe('true')
  })

  it('習熟度未選択時は警告テキストが表示される', () => {
    const wrapper = createWrapper({ isChecked: true, value: undefined })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('習熟度選択済みなら警告テキストが表示されない', () => {
    const wrapper = createWrapper({ isChecked: true, value: 3 })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
