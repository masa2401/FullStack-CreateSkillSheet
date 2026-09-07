import { nextTick } from 'vue'

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EditableNameHeading from './EditableNameHeading.vue'

describe('EditableNameHeading', () => {
  // ─── 表示 ────────────────────────────────────────────────────

  it('displayName が見出しに表示される', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    expect(wrapper.find('[data-slot="user-name-heading"]').text()).toContain('Guest')
  })

  it('initialName が空の場合、最初から編集可能（readonly ではない）', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    expect(wrapper.find('input').attributes('readonly')).toBeUndefined()
  })

  it('initialName が設定済みの場合、最初からロック状態（readonly）で開始する', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '山田太郎', displayName: '山田太郎' },
    })
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
  })

  it('displayName の変更は見出しに反映されるが、入力中の draft には影響しない', async () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    await wrapper.find('input').setValue('入力中')

    await wrapper.setProps({ displayName: '更新後の名前' })

    expect(wrapper.find('[data-slot="user-name-heading"]').text()).toContain('更新後の名前')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('入力中')
  })

  // ─── 入力欄の幅 ───────────────────────────────────────────────

  /** `width: calc(3.4em + 1rem)` から em 部分の数値を取り出す */
  const widthEmOf = (wrapper: ReturnType<typeof mount>): number => {
    const style = wrapper.find('input').attributes('style') ?? ''
    const matched = /calc\(([\d.]+)em/.exec(style)
    if (!matched?.[1]) throw new Error(`em 指定が見つからない: ${style}`)
    return Number(matched[1])
  }

  it('未入力のときはプレースホルダの幅が使われる', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    // 「お名前を入力」= 全角6文字 + 余白
    expect(widthEmOf(wrapper)).toBeCloseTo(6.6)
  })

  it('半角のみの名前は全角のみの名前より入力欄が狭くなる', async () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })

    await wrapper.find('input').setValue('TEST')
    const halfWidth = widthEmOf(wrapper)

    await wrapper.find('input').setValue('山田太郎')
    const fullWidth = widthEmOf(wrapper)

    expect(halfWidth).toBeLessThan(fullWidth)
  })

  it('入力に応じて幅が変わる', async () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })

    await wrapper.find('input').setValue('山田')
    const shorter = widthEmOf(wrapper)

    await wrapper.find('input').setValue('山田太郎')

    expect(widthEmOf(wrapper)).toBeGreaterThan(shorter)
  })

  it('幅は上限でクランプされる', async () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })

    await wrapper.find('input').setValue('あ'.repeat(20))
    const atLimit = widthEmOf(wrapper)

    await wrapper.find('input').setValue('あ'.repeat(40))

    expect(widthEmOf(wrapper)).toBe(atLimit)
  })

  // ─── Enterキー ────────────────────────────────────────────────

  it('Enterキーを押すと preventDefault され、入力欄が blur される', async () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    const blurSpy = vi.spyOn(wrapper.find('input').element as HTMLInputElement, 'blur')

    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(blurSpy).toHaveBeenCalledOnce()
  })

  it('Enter以外のキーでは blur されない', async () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    const blurSpy = vi.spyOn(wrapper.find('input').element as HTMLInputElement, 'blur')

    await wrapper.find('input').trigger('keydown', { key: 'a' })

    expect(blurSpy).not.toHaveBeenCalled()
  })

  // ─── コミットフロー（デバウンス） ──────────────────────────────────

  describe('コミットフロー', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('入力してblurすると、一定時間後に commit イベントが発火する', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.emitted('commit')).toEqual([['山田太郎']])
    })

    it('確定前にもう一度focusすると、commit はキャンセルされ発火しない', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      await input.trigger('focus')
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.emitted('commit')).toBeUndefined()
    })

    it('コミット確定後は readonly になり、「名前を訂正する」リンクが表示される', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.find('input').attributes('readonly')).toBeDefined()
      expect(wrapper.find('[data-slot="edit-name-button"]').exists()).toBe(true)
    })

    it('コミット確定後、プログレスバー（edit-progress-fill）がレンダリングされる', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.find('[data-slot="edit-progress-fill"]').exists()).toBe(true)
    })

    it('「名前を訂正する」をクリックすると再び編集可能になる', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      await wrapper.find('[data-slot="edit-name-button"]').trigger('click')
      expect(wrapper.find('input').attributes('readonly')).toBeUndefined()
    })
  })
})
