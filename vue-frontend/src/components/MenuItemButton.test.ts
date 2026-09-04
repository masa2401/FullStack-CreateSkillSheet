import { defineComponent } from 'vue'

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import MenuItemButton from './MenuItemButton.vue'

/**
 * `DropdownMenuItem` は `DropdownMenu` のコンテキストを必要とし、
 * かつ Portal 経由で `<body>` 直下へ描画されるため、ホスト越しにマウントする。
 * Portal の描画は同期的に完了しないので、取得は必ず `findByRole` で待つ。
 */
const Host = defineComponent({
  components: { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, MenuItemButton },
  props: { itemProps: { type: Object, required: true } },
  emits: ['item-click'],
  template: `
    <DropdownMenu :open="true">
      <DropdownMenuTrigger>開く</DropdownMenuTrigger>
      <DropdownMenuContent>
        <MenuItemButton v-bind="itemProps" @click="$emit('item-click')" />
      </DropdownMenuContent>
    </DropdownMenu>
  `,
})

const renderMenuItem = (props = {}) =>
  render(Host, {
    props: { itemProps: { icon: 'fa-solid fa-check', text: 'テスト', ...props } },
    global: { stubs: { 'font-awesome-icon': true } },
  })

const findMenuItem = () => screen.findByRole('menuitem')

describe('MenuItemButton', () => {
  it('text が表示される', async () => {
    renderMenuItem({ text: 'ラベル' })
    expect(await findMenuItem()).toHaveTextContent('ラベル')
  })

  it('variant が success のとき success 用のクラスが付く', async () => {
    renderMenuItem({ variant: 'success' })
    expect(await findMenuItem()).toHaveClass('text-emerald-700')
  })

  it('variant が error のとき error 用のクラスが付く', async () => {
    renderMenuItem({ variant: 'error' })
    expect(await findMenuItem()).toHaveClass('text-red-600')
  })

  it('disabled が true のとき data-disabled が付く', async () => {
    renderMenuItem({ disabled: true })
    expect(await findMenuItem()).toHaveAttribute('data-disabled')
  })

  it('選択時に click イベントが emit される', async () => {
    const user = userEvent.setup()
    const { emitted } = renderMenuItem()

    await user.click(await findMenuItem())

    expect(emitted('item-click')).toBeTruthy()
  })
})
