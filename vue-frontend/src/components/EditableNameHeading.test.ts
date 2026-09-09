import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EditableNameHeading from './EditableNameHeading.vue'

const renderHeading = (props = {}) =>
  render(EditableNameHeading, {
    props: { initialName: '', displayName: 'Guest', ...props },
  })

const nameInput = () => screen.getByRole('textbox', { name: 'お名前（20文字まで）' })

const editButton = () => screen.getByRole('button', { name: '名前を編集する' })

describe('EditableNameHeading', () => {
  // ─── 表示 ────────────────────────────────────────────────────

  it('displayName が見出しに表示される', () => {
    renderHeading()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Guest 様のスキルシート')
  })

  it('initialName が空の場合、最初から編集可能（readonly ではない）', () => {
    renderHeading()
    expect(nameInput()).not.toHaveAttribute('readonly')
  })

  it('initialName が設定済みの場合、最初からロック状態（readonly）で開始する', () => {
    renderHeading({ initialName: '山田太郎', displayName: '山田太郎' })
    expect(nameInput()).toHaveAttribute('readonly')
  })

  it('displayName の変更は見出しに反映されるが、入力中の draft には影響しない', async () => {
    const user = userEvent.setup()
    const { rerender } = renderHeading()
    await user.type(nameInput(), '入力中')

    await rerender({ displayName: '更新後の名前' })

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '更新後の名前 様のスキルシート',
    )
    expect(nameInput()).toHaveValue('入力中')
  })

  // ─── Enterキー ────────────────────────────────────────────────

  it('Enterキーを押すと入力欄からフォーカスが外れる', async () => {
    const user = userEvent.setup()
    renderHeading()

    await user.click(nameInput())
    expect(nameInput()).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(nameInput()).not.toHaveFocus()
  })

  it('Enter以外のキーではフォーカスが外れない', async () => {
    const user = userEvent.setup()
    renderHeading()

    await user.click(nameInput())
    await user.keyboard('a')

    expect(nameInput()).toHaveFocus()
  })

  // ─── コミットフロー（デバウンス） ──────────────────────────────────

  describe('コミットフロー', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    /** フェイクタイマー下で user-event を使うには、時間を進める関数を渡す必要がある */
    const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const typeNameAndBlur = async (user: ReturnType<typeof setupUser>) => {
      await user.type(nameInput(), '山田太郎')
      await user.tab()
    }

    it('入力してblurすると、一定時間後に commit イベントが発火する', async () => {
      const user = setupUser()
      const { emitted } = renderHeading()

      await typeNameAndBlur(user)
      await vi.advanceTimersByTimeAsync(2000)

      expect(emitted().commit).toEqual([['山田太郎']])
    })

    it('確定前にもう一度focusすると、commit はキャンセルされ発火しない', async () => {
      const user = setupUser()
      const { emitted } = renderHeading()

      await typeNameAndBlur(user)
      await user.click(nameInput())
      await vi.advanceTimersByTimeAsync(2000)

      expect(emitted().commit).toBeUndefined()
    })

    it('コミット確定後は readonly になり、「名前を編集する」ボタンが表示される', async () => {
      const user = setupUser()
      renderHeading()

      await typeNameAndBlur(user)
      await vi.advanceTimersByTimeAsync(2000)

      expect(nameInput()).toHaveAttribute('readonly')
      expect(editButton()).toBeInTheDocument()
    })

    it('コミット確定後、編集可能期間のプログレスバーがレンダリングされる', async () => {
      const user = setupUser()
      const { container } = renderHeading()

      await typeNameAndBlur(user)
      await vi.advanceTimersByTimeAsync(2000)

      expect(container.querySelector('[data-slot="edit-progress-fill"]')).toBeInTheDocument()
    })

    it('「名前を編集する」をクリックすると再び編集可能になる', async () => {
      const user = setupUser()
      renderHeading()

      await typeNameAndBlur(user)
      await vi.advanceTimersByTimeAsync(2000)

      await user.click(editButton())

      expect(nameInput()).not.toHaveAttribute('readonly')
    })
  })
})
