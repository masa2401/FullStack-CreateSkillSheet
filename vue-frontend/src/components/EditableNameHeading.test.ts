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
    expect(wrapper.find('.user-name-heading').text()).toContain('Guest')
  })

  it('initialName が空の場合、最初から編集可能（readonly ではない）', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    expect(wrapper.find('input').attributes('readonly')).toBeUndefined()
  })

  it('initialName が空の場合、最初から入力欄に is-editable-hint クラスが付与される', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '', displayName: 'Guest' },
    })
    expect(wrapper.find('input').classes()).toContain('is-editable-hint')
  })

  it('initialName が設定済み（ロック状態）の場合、is-editable-hint クラスは付与されない', () => {
    const wrapper = mount(EditableNameHeading, {
      props: { initialName: '山田太郎', displayName: '山田太郎' },
    })
    expect(wrapper.find('input').classes()).not.toContain('is-editable-hint')
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

    expect(wrapper.find('.user-name-heading').text()).toContain('更新後の名前')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('入力中')
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
      expect(wrapper.find('.edit-name-button').exists()).toBe(true)
    })

    it('コミット確定後、プログレスバー（.edit-progress-fill）がレンダリングされる', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.find('.edit-progress-fill').exists()).toBe(true)
    })

    it('コミット確定後（committed）は is-editable-hint クラスが外れる', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.find('input').classes()).not.toContain('is-editable-hint')
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

      await wrapper.find('.edit-name-button').trigger('click')
      expect(wrapper.find('input').attributes('readonly')).toBeUndefined()
    })

    it('「名前を訂正する」で再編集を開始すると is-editable-hint クラスが再度付与される', async () => {
      const wrapper = mount(EditableNameHeading, {
        props: { initialName: '', displayName: 'Guest' },
      })

      const input = wrapper.find('input')
      await input.setValue('山田太郎')
      await input.trigger('blur')
      vi.advanceTimersByTime(2000)
      await nextTick()

      await wrapper.find('.edit-name-button').trigger('click')
      expect(wrapper.find('input').classes()).toContain('is-editable-hint')
    })
  })
})
