import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PdfGenerationState } from '@/composables/usePdfStatus'

import PdfButton from './PdfButton.vue'

const createWrapper = (state: PdfGenerationState, progress = 0) =>
  mount(PdfButton, {
    props: { state, progress },
    global: {
      stubs: {
        'font-awesome-icon': true,
        Progress: {
          name: 'Progress',
          props: ['modelValue'],
          template: '<div class="progress-stub" />',
        },
        MenuItemButton: {
          name: 'MenuItemButton',
          props: ['icon', 'text', 'variant', 'spin', 'disabled', 'closeOnSelect'],
          template:
            '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}<slot /></button>',
          emits: ['click'],
        },
      },
    },
  })

describe('PdfButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── 生成中 ─────────────────────────────────────

  it('generating 状態では「PDFを準備中...」と進捗バーが表示され、選択できない', () => {
    const wrapper = createWrapper('generating', 42)
    expect(wrapper.find('button').text()).toContain('PDFを準備中...')
    expect(wrapper.findComponent({ name: 'Progress' }).props('modelValue')).toBe(42)
    expect(wrapper.findComponent({ name: 'MenuItemButton' }).props('disabled')).toBe(true)
  })

  it('slow 状態では文言が切り替わり、バーは表示されたままになる', () => {
    const wrapper = createWrapper('slow', 100)
    expect(wrapper.find('button').text()).toContain('PDF処理に時間がかかっています...')
    expect(wrapper.findComponent({ name: 'Progress' }).exists()).toBe(true)
  })

  it('生成中にクリックしても download / retry は emit されない', async () => {
    const wrapper = createWrapper('generating', 10)
    await wrapper.findComponent({ name: 'MenuItemButton' }).vm.$emit('click')
    expect(wrapper.emitted('download')).toBeFalsy()
    expect(wrapper.emitted('retry')).toBeFalsy()
  })

  // ─── 完了 ───────────────────────────────────────

  it('ready 状態では「PDFをダウンロード」と表示され、バーは消える', () => {
    const wrapper = createWrapper('ready')
    expect(wrapper.find('button').text()).toContain('PDFをダウンロード')
    expect(wrapper.findComponent({ name: 'Progress' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'MenuItemButton' }).props('variant')).toBe('success')
  })

  it('ready 状態でクリックすると download が emit される', async () => {
    const wrapper = createWrapper('ready')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('download')).toBeTruthy()
  })

  // ─── 失敗 ───────────────────────────────────────

  it('error 状態では再試行の文言になり、バーは消える', () => {
    const wrapper = createWrapper('error')
    expect(wrapper.find('button').text()).toContain('PDF生成に失敗（再試行）')
    expect(wrapper.findComponent({ name: 'Progress' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'MenuItemButton' }).props('variant')).toBe('error')
  })

  it('error 状態でクリックすると retry が emit される', async () => {
    const wrapper = createWrapper('error')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })
})
