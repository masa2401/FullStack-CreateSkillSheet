import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { globalStubs } from '@/test/utils';
import type { ValidationError as VError } from '@/types';
import ValidationError from './ValidationError.vue';

describe('ValidationError', () => {
  const createWrapper = (propsData: { errors: VError[] }) =>
    mount(ValidationError, { props: propsData, ...globalStubs });

  it('errors が空のとき何も表示されない', () => {
    const wrapper = createWrapper({ errors: [] });
    expect(wrapper.find('.error-message').exists()).toBe(false);
  });

  it('errors がある場合エラーメッセージが表示される', () => {
    const errors: VError[] = [{ category: 'テスト', text: 'エラー' }];
    const wrapper = createWrapper({ errors });
    expect(wrapper.find('.error-message').exists()).toBe(true);
  });

  it('同じカテゴリ・テキストのエラーは1件にグループ化される', () => {
    const errors: VError[] = [
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q1' },
    ];
    const wrapper = createWrapper({ errors });
    expect(wrapper.findAll('.error-item')).toHaveLength(1);
  });

  it('グループ化された件数が表示される', () => {
    const errors: VError[] = [
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q1' },
    ];
    const wrapper = createWrapper({ errors });
    expect(wrapper.find('.error-count').text()).toContain('2件');
  });

  it('異なるカテゴリのエラーは別々に表示される', () => {
    const errors: VError[] = [
      { category: '共通', text: 'Q1' },
      { category: 'エンジニア', text: 'Q1' },
    ];
    const wrapper = createWrapper({ errors });
    expect(wrapper.findAll('.error-item')).toHaveLength(2);
  });

  it('30文字を超えるテキストは省略される', () => {
    const errors: VError[] = [{ category: 'テスト', text: 'a'.repeat(40) }];
    const wrapper = createWrapper({ errors });
    expect(wrapper.find('.error-question').text()).toContain('...');
  });

  it('30文字以下のテキストは省略されない', () => {
    const shortText = 'Q1. テスト質問';
    const errors: VError[] = [{ category: 'テスト', text: shortText }];
    const wrapper = createWrapper({ errors });
    expect(wrapper.find('.error-question').text()).not.toContain('...');
  });
});
