import { describe, expect, it, vi } from 'vitest'

import { CATEGORY_MASTER_BY_ID } from '@/data/questions'
import type { CategorySelection } from '@/types'

import { convertToCsv, downloadCsv } from './csvUtils'

const mockSelections: CategorySelection[] = [
  {
    categoryId: 1,
    isChecked: true,
    questions: [
      {
        questionId: 1,
        answers: [
          { answerId: 1, isChecked: true, value: 3 },
          { answerId: 2, isChecked: false },
        ],
      },
    ],
  },
]

describe('convertToCsv', () => {
  const csv = convertToCsv('テストユーザー', mockSelections)

  it('ユーザー名が含まれる', () => {
    expect(csv).toContain('テストユーザー')
  })

  it('チェックされていない回答は出力されない', () => {
    const lines = csv.split('\r\n')
    const answerLines = lines.filter((l) => {
      const cols = l.split(',')
      return cols.length === 4 && cols[2] !== '""' && l.includes('★')
    })
    expect(answerLines).toHaveLength(1)
  })

  it('BOMなしの文字列が返る（BOMはdownloadCsv側で付与）', () => {
    expect(csv.startsWith('\uFEFF')).toBe(false)
  })

  it('ダブルクォートを含むユーザー名はエスケープされる', () => {
    const csv = convertToCsv('山田"太郎', mockSelections)
    expect(csv).toContain('山田""太郎')
  })

  it('数式として解釈される文字で始まるユーザー名は先頭にアポストロフィが付与される', () => {
    expect(convertToCsv('=SUM(1)', mockSelections)).toContain(`"'=SUM(1)"`)
    expect(convertToCsv('-山田太郎', mockSelections)).toContain(`"'-山田太郎"`)
  })

  it('通常のユーザー名にはアポストロフィが付与されない', () => {
    expect(convertToCsv('山田太郎', mockSelections)).toContain('"山田太郎"')
  })

  it('isChecked: false のカテゴリは出力されない', () => {
    const selectionsWithUnchecked: CategorySelection[] = [
      ...mockSelections,
      {
        categoryId: 2,
        isChecked: false,
        questions: [
          {
            questionId: 1,
            answers: [{ answerId: 1, isChecked: true, value: 1 }],
          },
        ],
      },
    ]
    const csv = convertToCsv('テストユーザー', selectionsWithUnchecked)
    expect(csv).not.toContain('プログラマ / ITエンジニア')
  })

  it('同カテゴリの2行目以降はカテゴリ名が空になる（マージ表現）', () => {
    const selectionsMultiAnswer: CategorySelection[] = [
      {
        categoryId: 1,
        isChecked: true,
        questions: [
          {
            questionId: 1,
            answers: [
              { answerId: 1, isChecked: true, value: 2 },
              { answerId: 2, isChecked: true, value: 4 },
            ],
          },
        ],
      },
    ]
    const csv = convertToCsv('マルチユーザー', selectionsMultiAnswer)
    const lines = csv.split('\r\n')
    const categoryLines = lines.filter((l) => l.includes('共通スキル'))
    expect(categoryLines).toHaveLength(1)
  })

  it('全カテゴリが isChecked: false の場合はユーザー名のみ出力される', () => {
    const emptySelections: CategorySelection[] = [
      {
        categoryId: 1,
        isChecked: false,
        questions: [],
      },
    ]
    const csv = convertToCsv('空ユーザー', emptySelections)
    expect(csv).toContain('空ユーザー')
    expect(csv).not.toContain('共通スキル')
  })

  it('改行を含むユーザー名はクォートで囲まれる', () => {
    const csv = convertToCsv('改行\nユーザー', mockSelections)
    expect(csv).toContain('"改行\nユーザー"')
  })

  it('selectionsが不正な場合はエラーをthrowする', () => {
    expect(() => convertToCsv('テストユーザー', null as unknown as CategorySelection[])).toThrow()
  })

  it('マスターデータに存在しない categoryId は無視される', () => {
    const csv = convertToCsv('山田太郎', [{ categoryId: 999, isChecked: true, questions: [] }])
    expect(csv).not.toContain('undefined')
  })

  it('マスターデータに存在しない questionId は無視される', () => {
    const csv = convertToCsv('山田太郎', [
      { categoryId: 1, isChecked: true, questions: [{ questionId: 999, answers: [] }] },
    ])
    expect(csv).not.toContain('undefined')
  })

  it('マスターデータに存在しない answerId は無視される', () => {
    const csv = convertToCsv('山田太郎', [
      {
        categoryId: 1,
        isChecked: true,
        questions: [{ questionId: 1, answers: [{ answerId: 999, isChecked: true, value: 3 }] }],
      },
    ])
    expect(csv).not.toContain('undefined')
  })

  it('チェック済みの回答が無い質問は出力対象から除外される', () => {
    const csv = convertToCsv('山田太郎', [
      {
        categoryId: 1,
        isChecked: true,
        questions: [{ questionId: 1, answers: [{ answerId: 1, isChecked: false }] }],
      },
    ])
    const lines = csv.split('\r\n')
    expect(lines[lines.length - 1]).toBe('"カテゴリ","質問項目","スキル・技術要素","習熟度"')
  })

  it('習熟度（value）が未設定の場合、星の列は空文字になる', () => {
    const categoryMaster = CATEGORY_MASTER_BY_ID.get(1)!
    const questionDef = categoryMaster.questions[0]!
    const answerDef = questionDef.answers[0]!

    const csv = convertToCsv('山田太郎', [
      {
        categoryId: 1,
        isChecked: true,
        questions: [
          {
            questionId: questionDef.id,
            answers: [{ answerId: answerDef.id, isChecked: true, value: undefined }],
          },
        ],
      },
    ])
    const lines = csv.split('\r\n')
    expect(lines[lines.length - 1]).toBe(
      `"${categoryMaster.label}","${questionDef.title}","${answerDef.label}",""`,
    )
  })

  it('内部で例外が発生すると、捕捉せずに呼び出し元へ throw する', () => {
    const broken = [
      { categoryId: 1, isChecked: true, questions: null },
    ] as unknown as CategorySelection[]

    expect(() => convertToCsv('山田太郎', broken)).toThrow(TypeError)
  })
})

describe('downloadCsv', () => {
  it('正常なデータの場合は true を返す', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const result = downloadCsv('テストユーザー', mockSelections)
    expect(result).toBe(true)
    expect(clickSpy).toHaveBeenCalled()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    clickSpy.mockRestore()
  })

  it('userName が空の場合は false を返す', () => {
    expect(downloadCsv('', mockSelections)).toBe(false)
  })

  it('Blob生成に失敗した場合はfalseを返す', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('blob error')
    })
    const result = downloadCsv('テストユーザー', mockSelections)
    expect(result).toBe(false)
    createObjectURLSpy.mockRestore()
  })

  it('selections が空配列の場合は false を返す', () => {
    expect(downloadCsv('山田太郎', [])).toBe(false)
  })

  it('CSV変換中に例外が発生した場合は false を返す', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = [
      { categoryId: 1, isChecked: true, questions: null },
    ] as unknown as CategorySelection[]

    expect(downloadCsv('山田太郎', broken)).toBe(false)
    consoleErrorSpy.mockRestore()
  })

  it('ファイル名の日付はUTCではなくローカル日付になる', () => {
    vi.useFakeTimers()
    // UTCの2025/12/31 15:30 ＝ JSTの2026/1/1 0:30。UTC日付とJST日付が食い違う瞬間を
    // 絶対時刻で固定する。vite.config.ts の env.TZ で JST に固定されている前提のテスト
    vi.setSystemTime(new Date('2025-12-31T15:30:00Z'))
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    let downloadName = ''
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download
    })

    downloadCsv('山田太郎', mockSelections)
    expect(downloadName).toBe('山田太郎様_スキルシート_2026-01-01.csv')

    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    clickSpy.mockRestore()
    vi.useRealTimers()
  })
})
