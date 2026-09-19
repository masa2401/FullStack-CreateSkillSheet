import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import { LEVEL_LABELS } from '@/utils/constants'

import LevelLegend from './LevelLegend.vue'

describe('LevelLegend', () => {
  it('習熟度の段階の数だけ項目が表示される', () => {
    render(LevelLegend)
    expect(screen.getAllByRole('listitem')).toHaveLength(LEVEL_LABELS.length)
  })

  it('各項目に星と説明が表示される', () => {
    render(LevelLegend)
    const items = screen.getAllByRole('listitem')
    LEVEL_LABELS.forEach((level, i) => {
      expect(items[i]).toHaveTextContent(`${level.stars}： ${level.text}`)
    })
  })
})
