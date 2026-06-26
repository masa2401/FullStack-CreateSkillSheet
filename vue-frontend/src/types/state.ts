export type StarLevel = 1 | 2 | 3 | 4 | 5;

export type Answer = {
  id: number;
  label: string;
};

export type Question = {
  id: number;
  questionText: string;
  answers: Answer[];
};

export type AnswerSelection = {
  answerId: number;
  isChecked: boolean;
  value?: StarLevel;
};

export type QuestionSelection = {
  questionId: number;
  answers: AnswerSelection[];
};

export type CategorySelection = {
  categoryId: number;
  isChecked: boolean;
  questions: QuestionSelection[];
};

export interface SurveyState {
  userName: string;
  selections: CategorySelection[];
}

export interface ValidationError {
  category: string;
  text: string;
  answer?: string;
}
