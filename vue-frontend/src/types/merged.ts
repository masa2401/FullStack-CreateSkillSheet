import type { StarLevel } from './state';

export type MergedAnswer = {
  id: number;
  label: string;
  isChecked: boolean;
  value?: StarLevel;
};

export type MergedQuestion = {
  id: number;
  questionText: string;
  answers: MergedAnswer[];
};

export type MergedCategory = {
  id: number;
  label: string;
  icon: string;
  isChecked: boolean;
  questions: MergedQuestion[];
};
