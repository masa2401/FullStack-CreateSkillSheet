import { globalStubs } from '@/test/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import AnswerItem from './AnswerItem.vue';
import QuestionCard from './QuestionCard.vue';

const mockQuestion = {
  id: 1,
  questionText: 'Q1. テスト質問',
  answers: [
    { id: 1, label: '回答A', isChecked: false },
    { id: 2, label: '回答B', isChecked: true, value: 3 as const },
  ],
};

const createWrapper = (propsData = {}) =>
  mount(QuestionCard, {
    props: { question: mockQuestion, ...propsData },
    ...globalStubs,
  });

describe('QuestionCard', () => {
  it('質問文が表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.question-text').text()).toBe('Q1. テスト質問');
  });

  it('回答の数だけ AnswerItem が表示される', () => {
    const wrapper = createWrapper();
    expect(wrapper.findAllComponents(AnswerItem)).toHaveLength(2);
  });

  it('AnswerItem から update:answer を受け取ると update:answer を emit する', async () => {
    const wrapper = createWrapper();
    const answerItem = wrapper.findComponent(AnswerItem);
    const payload = { answerId: 1, patch: { isChecked: true } };

    answerItem.vm.$emit('update:answer', payload);
    await nextTick();
    expect(wrapper.emitted('update:answer')).toBeTruthy();

    const emitted = wrapper.emitted('update:answer')!;
    expect(emitted[0]![0]).toEqual(payload);
  });
});
