import type { QuestionState } from '@/types';
import { describe, expect, it } from 'vitest';
import { globalStubs } from '@/test/utils';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import QuestionCard from './QuestionCard.vue';
import AnswerItem from './AnswerItem.vue';

const mockQuestion: QuestionState = {
  id: 1,
  questionText: 'Q1. テスト質問',
  answers: [
    { label: '回答A', isChecked: false },
    { label: '回答B', isChecked: true, value: 3 },
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

  it('AnswerItem から update:answer を受け取ると update:question を emit する', async () => {
    const wrapper = createWrapper();
    const updatedAnswer = { label: '回答A', isChecked: true };
    const answerItem = wrapper.findComponent(AnswerItem);

    answerItem.vm.$emit('update:answer', updatedAnswer);
    await nextTick();
    expect(wrapper.emitted('update:question')).toBeTruthy();

    const emittedEvent = wrapper.emitted<[QuestionState]>('update:question');
    expect(emittedEvent).toBeDefined();

    const [[emittedQuestion]] = emittedEvent as [[QuestionState]];
    expect(emittedQuestion.answers[0]).toEqual(updatedAnswer);
  });

  it('更新は該当インデックスの回答のみに反映される', async () => {
    const wrapper = createWrapper();
    const answerItem = wrapper.findComponent(AnswerItem);
    const updatedAnswer = { label: '回答A', isChecked: true };
    answerItem.vm.$emit('update:answer', updatedAnswer);
    await nextTick();

    const emittedEvent = wrapper.emitted<[QuestionState]>('update:question');
    expect(emittedEvent).toBeDefined();

    const [[emittedQuestion]] = emittedEvent as [[QuestionState]];
    expect(emittedQuestion.answers[1]).toEqual(mockQuestion.answers[1]);
  });
});
