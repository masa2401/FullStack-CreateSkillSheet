export type Question = {
  id: number;
  questionText: string;
  answers: string[];
};

export type QuestionState = Omit<Question, 'answers'> & {
  answers: Answer[];
};

export type StarLevel = 1 | 2 | 3 | 4 | 5;

export type Answer = {
  label: string;
  isChecked?: boolean;
  value?: StarLevel;
};

export type QuestionCategory = 'common' | 'engineer' | 'designer';

export interface CategoryMeta {
  label: string;
  description: string;
}
