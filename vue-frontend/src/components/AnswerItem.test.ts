import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import AnswerItem from '@/components/AnswerItem.vue'
import type { StarLevel } from '@/types'

const WARNING_TEXT = '習熟度を選択してください'

const renderAnswerItem = (
  propsOverrides: {
    answerId?: number
    label?: string
    isChecked?: boolean
    value?: StarLevel
    isFlagged?: boolean
  } = {},
) =>
  render(AnswerItem, {
    props: {
      answerId: 1,
      label: 'テスト回答',
      isChecked: false,
      ...propsOverrides,
    },
    global: { stubs: { 'font-awesome-icon': true } },
  })

describe('AnswerItem.vue', () => {
  // ─── 展開 ────────────────────────────────────────────────────

  it('isChecked が true のとき習熟度選択が表示される', () => {
    renderAnswerItem({ isChecked: true })
    expect(screen.getByRole('radiogroup', { name: 'テスト回答 の習熟度' })).toBeInTheDocument()
  })

  it('isChecked が false のとき習熟度選択が表示されない', () => {
    renderAnswerItem({ isChecked: false })
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('チェックボックスの状態が isChecked と対応する', () => {
    renderAnswerItem({ isChecked: true })
    expect(screen.getByRole('checkbox', { name: 'テスト回答' })).toBeChecked()
  })

  // ─── 入力 ────────────────────────────────────────────────────

  it('チェックボックス操作時に update:answer が emit される', async () => {
    const user = userEvent.setup()
    const { emitted } = renderAnswerItem({ answerId: 7, isChecked: false })

    await user.click(screen.getByRole('checkbox', { name: 'テスト回答' }))

    expect(emitted()['update:answer']![0]).toEqual([{ answerId: 7, patch: { isChecked: true } }])
  })

  it('習熟度ボタンを選択すると value が更新される', async () => {
    const user = userEvent.setup()
    const { emitted } = renderAnswerItem({ answerId: 7, isChecked: true })

    expect(screen.getAllByRole('radio')).toHaveLength(5)
    await user.click(screen.getByRole('radio', { name: /^習熟度 3:/ }))

    expect(emitted()['update:answer']![0]).toEqual([{ answerId: 7, patch: { value: 3 } }])
  })

  it('選択済みの習熟度に aria-checked が付く', () => {
    renderAnswerItem({ isChecked: true, value: 3 })
    expect(screen.getByRole('radio', { name: /^習熟度 3:/ })).toBeChecked()
  })

  // ─── 警告テキスト ─────────────────────────────────────────────

  it('指摘済みかつ習熟度未選択のとき警告テキストが表示される', () => {
    renderAnswerItem({ isChecked: true, isFlagged: true })
    expect(screen.getByText(WARNING_TEXT)).toBeInTheDocument()
  })

  it('未指摘なら習熟度未選択でも警告テキストが表示されない', () => {
    renderAnswerItem({ isChecked: true })
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument()
  })

  it('指摘済みでも習熟度を選択済みなら警告テキストが表示されない', () => {
    renderAnswerItem({ isChecked: true, value: 3, isFlagged: true })
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument()
  })

  it('警告テキストは role="alert" を持たない（読み上げは ValidationError に委ねる）', () => {
    renderAnswerItem({ isChecked: true, isFlagged: true })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
