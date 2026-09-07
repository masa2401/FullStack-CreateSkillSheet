import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import QuestionCard from './QuestionCard.vue'

/**
 * `@testing-library/vue` には `findComponent` が無いため、
 * 子の emit を起点にしたい箇所はクリック駆動のスタブへ差し替える。
 */
const ANSWER_ITEM_STUB = {
  props: {
    answerId: Number,
    label: String,
    isChecked: Boolean,
    value: Number,
    isFlagged: Boolean,
  },
  emits: ['update:answer'],
  template: `<button
      :data-flagged="isFlagged"
      @click="$emit('update:answer', { answerId, patch: { isChecked: true } })"
    >{{ label }}</button>`,
}

const mockQuestion = {
  id: 1,
  title: 'テスト質問',
  prompt: '当てはまるものを選択してください。',
  answers: [
    { id: 1, label: '回答A', isChecked: false },
    { id: 2, label: '回答B', isChecked: true, value: 3 as const },
  ],
}

const renderQuestionCard = (propsOverrides = {}) =>
  render(QuestionCard, {
    props: { question: mockQuestion, questionNumber: 1, ...propsOverrides },
    global: { stubs: { AnswerItem: ANSWER_ITEM_STUB } },
  })

const answerButton = (label: string) => screen.getByRole('button', { name: label })

describe('QuestionCard', () => {
  // ─── 表示 ────────────────────────────────────────────────────

  it('タイトルが Q番号付きで表示される', () => {
    renderQuestionCard()
    expect(screen.getByText('Q1. テスト質問')).toBeInTheDocument()
  })

  it('questionNumber に応じて Q番号が変わる', () => {
    renderQuestionCard({ questionNumber: 5 })
    expect(screen.getByText('Q5. テスト質問')).toBeInTheDocument()
  })

  it('設問文が表示される', () => {
    renderQuestionCard()
    expect(screen.getByText('当てはまるものを選択してください。')).toBeInTheDocument()
  })

  it('回答の数だけ AnswerItem が表示される', () => {
    renderQuestionCard()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  // ─── emit の中継 ──────────────────────────────────────────────

  it('AnswerItem から update:answer を受け取ると update:answer を emit する', async () => {
    const user = userEvent.setup()
    const { emitted } = renderQuestionCard()

    await user.click(answerButton('回答B'))

    expect(emitted()['update:answer']![0]).toEqual([{ answerId: 2, patch: { isChecked: true } }])
  })

  // ─── flaggedAnswerIds の伝播 ──────────────────────────────────

  it('flaggedAnswerIds 未指定なら、どの AnswerItem も指摘済みにならない', () => {
    renderQuestionCard()
    expect(answerButton('回答A')).toHaveAttribute('data-flagged', 'false')
    expect(answerButton('回答B')).toHaveAttribute('data-flagged', 'false')
  })

  it('flaggedAnswerIds に含まれる回答だけが指摘済みになる', () => {
    renderQuestionCard({ flaggedAnswerIds: [2] })
    expect(answerButton('回答A')).toHaveAttribute('data-flagged', 'false')
    expect(answerButton('回答B')).toHaveAttribute('data-flagged', 'true')
  })
})
