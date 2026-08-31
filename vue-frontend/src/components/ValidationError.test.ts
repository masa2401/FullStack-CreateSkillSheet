import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { ValidationError as VError } from '@/types'

import ValidationError from './ValidationError.vue'

describe('ValidationError', () => {
  const createWrapper = (propsData: { errors: VError[] }) =>
    mount(ValidationError, { props: propsData, stubs: { 'font-awesome-icon': true } })

  it('errors が空のとき何も表示されない', () => {
    const wrapper = createWrapper({ errors: [] })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('errors がある場合エラーメッセージが表示される', () => {
    const errors: VError[] = [{ category: 'テスト', text: 'エラー' }]
    const wrapper = createWrapper({ errors })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('同じカテゴリ・テキストのエラーは1件にグループ化される', () => {
    const errors: VError[] = [
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q1' },
    ]
    const wrapper = createWrapper({ errors })
    expect(wrapper.findAll('li')).toHaveLength(1)
  })

  it('グループ化された件数が表示される', () => {
    const errors: VError[] = [
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q1' },
    ]
    const wrapper = createWrapper({ errors })
    expect(wrapper.find('li').text()).toContain('2件')
  })

  it('異なるカテゴリのエラーは別々に表示される', () => {
    const errors: VError[] = [
      { category: '共通', text: 'Q1' },
      { category: 'エンジニア', text: 'Q1' },
    ]
    const wrapper = createWrapper({ errors })
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('text が指定されたエラーは補足テキストが表示される', () => {
    const errors: VError[] = [{ category: 'テスト', text: 'データベース' }]
    const wrapper = createWrapper({ errors })
    expect(wrapper.find('li').text()).toContain('データベース')
  })

  it('text が無いエラーは補足テキストが表示されない', () => {
    const errors: VError[] = [{ category: 'テスト' } as unknown as VError]
    const wrapper = createWrapper({ errors })
    expect(wrapper.find('li').text()).toBe('テスト（1件）')
  })
})
