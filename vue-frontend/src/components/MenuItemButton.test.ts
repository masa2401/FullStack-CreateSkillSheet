import { defineComponent } from 'vue'

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import MenuItemButton from './MenuItemButton.vue'

/**
 * DropdownMenuItem は DropdownMenu のコンテキストを必要とし、
 * かつ Portal 経由で body 直下に描画されるため、
 * ホストコンポーネント越しにマウントして document から参照する。
 */
const Host = defineComponent({
  components: { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, MenuItemButton },
  props: { itemProps: { type: Object, required: true } },
  template: `
    <DropdownMenu :open="true">
      <DropdownMenuTrigger>開く</DropdownMenuTrigger>
      <DropdownMenuContent>
        <MenuItemButton v-bind="itemProps" @click="$emit('item-click')" />
      </DropdownMenuContent>
    </DropdownMenu>
  `,
})

const createWrapper = (props = {}) =>
  mount(Host, {
    props: { itemProps: { icon: 'fa-solid fa-check', text: 'テスト', ...props } },
    attachTo: document.body,
    global: { stubs: { 'font-awesome-icon': true } },
  })

const menuItem = (): HTMLElement | null => document.querySelector('[role="menuitem"]')

describe('MenuItemButton', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('text が表示される', () => {
    createWrapper({ text: 'ラベル' })
    expect(menuItem()?.textContent).toContain('ラベル')
  })

  it('variant が success のとき success 用のクラスが付く', () => {
    createWrapper({ variant: 'success' })
    expect(menuItem()?.className).toContain('text-emerald-700')
  })

  it('variant が error のとき error 用のクラスが付く', () => {
    createWrapper({ variant: 'error' })
    expect(menuItem()?.className).toContain('text-red-600')
  })

  it('disabled が true のとき data-disabled が付く', () => {
    createWrapper({ disabled: true })
    expect(menuItem()?.getAttribute('data-disabled')).not.toBeNull()
  })

  it('選択時に click イベントが emit される', async () => {
    const wrapper = createWrapper()
    menuItem()?.dispatchEvent(
      new CustomEvent('menuitem.select', { bubbles: true, cancelable: true }),
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('item-click')).toBeTruthy()
  })
})
