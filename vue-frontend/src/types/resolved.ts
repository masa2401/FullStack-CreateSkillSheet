import type { StarLevel } from './state';

export type ResolvedAnswer = {
  id: number;
  label: string;
  isChecked: boolean;
  value?: StarLevel;
};

export type ResolvedQuestion = {
  id: number;
  questionText: string;
  answers: ResolvedAnswer[];
};

export type ResolvedCategory = {
  id: number;
  label: string;
  icon: string;
  isChecked: boolean;
  questions: ResolvedQuestion[];
};
