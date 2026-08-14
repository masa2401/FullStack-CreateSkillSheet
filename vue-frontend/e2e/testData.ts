import type { CategorySelection, StarLevel, SurveyState } from '@/types'

export const buildMinimalSurveyState = (
  userName: string,
  overrides?: { answerLabel?: string; value?: StarLevel },
): SurveyState => {
  const selections: CategorySelection[] = [
    {
      categoryId: 1,
      isChecked: true,
      questions: [
        {
          questionId: 1,
          answers: [
            {
              answerId: 1,
              isChecked: true,
              value: overrides?.value ?? 3,
            },
            { answerId: 2, isChecked: false },
            { answerId: 3, isChecked: false },
            { answerId: 4, isChecked: false },
          ],
        },
      ],
    },
    { categoryId: 2, isChecked: false, questions: [] },
    { categoryId: 3, isChecked: false, questions: [] },
  ]

  return { userName, selections }
}
