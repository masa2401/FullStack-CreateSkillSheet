import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ThemeToggle from './ThemeToggle.vue'

/**
 * 初期テーマは実行環境の設定に依存するため、固定値では検証しない。
 * `<html>` の `dark` クラス（`useColorMode` が書き込む実体）を真とし、
 * ボタンの表示がそれに追従しているかを見る。
 */
const isDarkApplied = (): boolean => document.documentElement.classList.contains('dark')

const expectedLabel = (): string =>
  isDarkApplied() ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    document.documentElement.className = ''
  })

  it('クリックで配色が切り替わり、aria-pressed が追従する', async () => {
    const user = userEvent.setup()
    render(ThemeToggle)
    const wasDark = isDarkApplied()

    await user.click(screen.getByRole('button'))

    expect(isDarkApplied()).toBe(!wasDark)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', String(isDarkApplied()))
  })

  it('アクセシブル名が現在の配色に応じた切り替え先を示す', async () => {
    const user = userEvent.setup()
    render(ThemeToggle)
    expect(screen.getByRole('button', { name: expectedLabel() })).toBeInTheDocument()

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button', { name: expectedLabel() })).toBeInTheDocument()
  })
})
