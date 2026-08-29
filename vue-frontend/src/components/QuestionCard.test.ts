import { nextTick } from 'vue'

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AnswerItem from './AnswerItem.vue'
import QuestionCard from './QuestionCard.vue'

const mockQuestion = {
  id: 1,
  title: 'テスト質問',
  prompt: '当てはまるものを選択してください。',
  answers: [
    { id: 1, label: '回答A', isChecked: false },
    { id: 2, label: '回答B', isChecked: true, value: 3 as const },
  ],
}

const createWrapper = (propsData = {}) =>
  mount(QuestionCard, {
    props: { question: mockQuestion, questionNumber: 1, ...propsData },
    stubs: { 'font-awesome-icon': true },
  })

describe('QuestionCard', () => {
  it('タイトルが Q番号付きで表示される', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.question-title').text()).toBe('Q1. テスト質問')
  })

  it('questionNumber に応じて Q番号が変わる', () => {
    const wrapper = createWrapper({ questionNumber: 5 })
    expect(wrapper.find('.question-title').text()).toBe('Q5. テスト質問')
  })

  it('設問文が表示される', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.question-prompt').text()).toBe('当てはまるものを選択してください。')
  })

  it('回答の数だけ AnswerItem が表示される', () => {
    const wrapper = createWrapper()
    expect(wrapper.findAllComponents(AnswerItem)).toHaveLength(2)
  })

  it('AnswerItem から update:answer を受け取ると update:answer を emit する', async () => {
    const wrapper = createWrapper()
    const answerItem = wrapper.findComponent(AnswerItem)
    const payload = { answerId: 1, patch: { isChecked: true } }

    answerItem.vm.$emit('update:answer', payload)
    await nextTick()
    expect(wrapper.emitted('update:answer')).toBeTruthy()

    const emitted = wrapper.emitted('update:answer')!
    expect(emitted[0]![0]).toEqual(payload)
  })
})
