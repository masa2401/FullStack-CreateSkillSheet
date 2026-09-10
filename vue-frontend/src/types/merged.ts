import type { StarLevel } from './state'

type MergedAnswer = {
  id: number
  label: string
  isChecked: boolean
  value?: StarLevel
}

export type MergedQuestion = {
  id: number
  title: string
  prompt: string
  answers: MergedAnswer[]
}

export type MergedCategory = {
  id: number
  key: string
  label: string
  isChecked: boolean
  questions: MergedQuestion[]
}
