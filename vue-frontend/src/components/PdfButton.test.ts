import { ref } from 'vue'

import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type PdfGenerationState, usePdfStatus } from '@/composables/usePdfStatus'

import PdfButton from './PdfButton.vue'

vi.mock('@/composables/usePdfStatus')

const mockRetry = vi.fn()

const createWrapper = (state: PdfGenerationState, downloadUrl = '') => {
  vi.mocked(usePdfStatus).mockReturnValue({
    state: ref(state),
    downloadUrl: ref(downloadUrl),
    retry: mockRetry,
  })

  return mount(PdfButton, {
    global: {
      plugins: [createTestingPinia({ initialState: { survey: { savedSheetId: 'sheet-1' } } })],
      stubs: { 'font-awesome-icon': true },
    },
  })
}

describe('PdfButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generating 状態では disabled になる', () => {
    const wrapper = createWrapper('generating')
    expect((wrapper.find('button').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('generating 状態でクリックしても何も起きない', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = createWrapper('generating')
    await wrapper.get('button').trigger('click')
    expect(openSpy).not.toHaveBeenCalled()
    expect(mockRetry).not.toHaveBeenCalled()
  })

  it('ready 状態では「PDFをダウンロード」と表示される', () => {
    const wrapper = createWrapper('ready', 'https://example.com/x.pdf')
    expect(wrapper.find('button').text()).toBe('PDFをダウンロード')
    expect((wrapper.find('button').element as HTMLButtonElement).disabled).toBe(false)
  })

  it('ready 状態でクリックすると window.open が呼ばれ done が emit される', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = createWrapper('ready', 'https://example.com/x.pdf')
    await wrapper.find('button').trigger('click')
    expect(openSpy).toHaveBeenCalledWith('https://example.com/x.pdf', '_blank')
    expect(wrapper.emitted('done')).toBeTruthy()
  })

  it('error 状態では再試行表示になりクリックで retry が呼ばれる', async () => {
    const wrapper = createWrapper('error')
    expect(wrapper.find('button').text()).toContain('再試行')
    await wrapper.find('button').trigger('click')
    expect(mockRetry).toHaveBeenCalledOnce()
  })
})
