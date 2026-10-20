import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import type { ValidationErrorItem } from '@/types'

import ValidationError from './ValidationError.vue'

const renderValidationError = (errors: ValidationErrorItem[]) =>
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
    renderValidationError([{ categoryLabel: 'テスト', questionTitle: 'エラー' }])
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('入力エラー')).toBeInTheDocument()
  })

  it('同じカテゴリ・テキストのエラーは1件にグループ化される', () => {
    renderValidationError([
      { categoryLabel: '共通', questionTitle: 'Q1' },
      { categoryLabel: '共通', questionTitle: 'Q1' },
    ])
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('同じカテゴリでもテキストが異なれば別々に表示される', () => {
    renderValidationError([
      { categoryLabel: '共通', questionTitle: 'Q1' },
      { categoryLabel: '共通', questionTitle: 'Q2' },
    ])
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('グループ化された件数が表示される', () => {
    renderValidationError([
      { categoryLabel: '共通', questionTitle: 'Q1' },
      { categoryLabel: '共通', questionTitle: 'Q1' },
    ])
    expect(screen.getByRole('listitem')).toHaveTextContent('（2件）')
  })

  it('異なるカテゴリのエラーは別々に表示される', () => {
    renderValidationError([
      { categoryLabel: '共通', questionTitle: 'Q1' },
      { categoryLabel: 'エンジニア', questionTitle: 'Q1' },
    ])
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('questionTitle が指定されたエラーは補足テキストが表示される', () => {
    renderValidationError([{ categoryLabel: 'テスト', questionTitle: 'データベース' }])
    expect(screen.getByText('データベース')).toBeInTheDocument()
  })

  it('questionTitle が無いエラーは補足テキストが表示されない', () => {
    renderValidationError([{ categoryLabel: 'テスト' } as unknown as ValidationErrorItem])
    expect(screen.getByRole('listitem')).toHaveTextContent(/^テスト（1件）$/)
  })
})
