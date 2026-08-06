import { nextTick, ref } from 'vue'

import { describe, expect, it } from 'vitest'

import { useNameValidation } from './useNameValidation'

describe('useNameValidation', () => {
  it('名前が入力されているとき validate は true を返す', () => {
    const userName = ref('テストユーザー')
    const { validate, validationErrors } = useNameValidation(userName)
    const result = validate()
    expect(result).toBe(true)
    expect(validationErrors.value).toHaveLength(0)
  })

  it('送信後に名前を入力するとエラーがリアルタイムで消える', async () => {
    const userName = ref('')
    const { validate, validationErrors } = useNameValidation(userName)

    validate()
    expect(validationErrors.value).toHaveLength(1)
    userName.value = 'テストユーザー'
    await nextTick()
    expect(validationErrors.value).toHaveLength(0)
  })

  it('空文字のとき validate は false を返す', () => {
    const userName = ref('')
    const { validate, validationErrors } = useNameValidation(userName)
    const result = validate()
    expect(result).toBe(false)
    expect(validationErrors.value).toHaveLength(1)
  })

  it('スペースのみの入力はエラーになる', () => {
    const userName = ref(' ')
    const { validate, validationErrors } = useNameValidation(userName)

    validate()
    expect(validationErrors.value).toHaveLength(1)
  })
})
