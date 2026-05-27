import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Answer } from '@/types';
import AnswerItem from '@/components/AnswerItem.vue';

describe('AnswerItem.vue', () => {
  const createWrapper = (propsAnswer: Partial<Answer> = {}) =>
    mount(AnswerItem, {
      props: {
        answer: { label: 'テスト回答', isChecked: false, value: undefined, ...propsAnswer },
        answerIndex: 0,
      },
    });
  it('isChecked が true のとき習熟度選択が表示される', () => {
    const wrapper = createWrapper({ isChecked: true });
    expect(wrapper.find('.level-selector').exists()).toBe(true);
  });

  it('isChecked が false のとき習熟度選択が表示されない', () => {
    const wrapper = createWrapper({ isChecked: false });
    expect(wrapper.find('.level-selector').exists()).toBe(false);
  });

  it('チェックボックス変更時に update:answer が emit される', async () => {
    const wrapper = createWrapper({ isChecked: false });
    await wrapper.find('input[type="checkbox"]').trigger('change');
    expect(wrapper.emitted('update:answer')).toBeTruthy();
  });

  it('習熟度ボタンをクリックすると value が更新される', async () => {
    const wrapper = createWrapper({ isChecked: true, value: undefined });
    const radios = wrapper.findAll('.level-radio');
    expect(radios.length).toBe(5);
    await radios[2]!.trigger('change');
    const emittedEvents = wrapper.emitted('update:answer');
    expect(emittedEvents).toBeTruthy();
    const [payload] = emittedEvents![0] as [{ value: number }];
    expect(payload.value).toBe(3);
  });

  it('習熟度未選択時は警告テキストが表示される', () => {
    const wrapper = createWrapper({ isChecked: true, value: undefined });
    expect(wrapper.find('.warning-text').exists()).toBe(true);
  });

  it('習熟度選択済みなら警告テキストが表示されない', () => {
    const wrapper = createWrapper({ isChecked: true, value: 3 });
    expect(wrapper.find('.warning-text').exists()).toBe(false);
  });
});
