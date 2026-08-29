import { defineComponent, h } from 'vue'

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { useSuccessFeedback } from './useSuccessFeedback'

describe('useSuccessFeedback', () => {
  it('アンマウント時にタイマーがクリアされ、done が呼ばれない', () => {
    vi.useFakeTimers()
    const done = vi.fn()
    const testComponent = defineComponent({
      setup() {
        const { trigger } = useSuccessFeedback(done)
        trigger()
        return () => h('div')
      },
    })
    const wrapper = mount(testComponent)

    wrapper.unmount()
    vi.advanceTimersByTime(2000)

    expect(done).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
