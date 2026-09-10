import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import type { ValidationError as VError } from '@/types'

import ValidationError from './ValidationError.vue'

const renderValidationError = (errors: VError[]) =>
  render(ValidationError, {
    props: { errors },
    global: { stubs: { 'font-awesome-icon': true } },
  })

describe('ValidationError', () => {
  it('errors が空のとき何も表示されない', () => {
    renderValidationError([])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('errors がある場合エラーメッセージが表示される', () => {
    renderValidationError([{ category: 'テスト', text: 'エラー' }])
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('入力エラー')).toBeInTheDocument()
  })

  it('同じカテゴリ・テキストのエラーは1件にグループ化される', () => {
    renderValidationError([
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q1' },
    ])
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('同じカテゴリでもテキストが異なれば別々に表示される', () => {
    renderValidationError([
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q2' },
    ])
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('グループ化された件数が表示される', () => {
    renderValidationError([
      { category: '共通', text: 'Q1' },
      { category: '共通', text: 'Q1' },
    ])
    expect(screen.getByRole('listitem')).toHaveTextContent('（2件）')
  })

  it('異なるカテゴリのエラーは別々に表示される', () => {
    renderValidationError([
      { category: '共通', text: 'Q1' },
      { category: 'エンジニア', text: 'Q1' },
    ])
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('text が指定されたエラーは補足テキストが表示される', () => {
    renderValidationError([{ category: 'テスト', text: 'データベース' }])
    expect(screen.getByText('データベース')).toBeInTheDocument()
  })

  it('text が無いエラーは補足テキストが表示されない', () => {
    renderValidationError([{ category: 'テスト' } as unknown as VError])
    expect(screen.getByRole('listitem')).toHaveTextContent(/^テスト（1件）$/)
  })
})
