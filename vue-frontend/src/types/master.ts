import type { Question } from './state';

export interface CategoryMaster {
  id: number;
  key: string;
  icon: string;
  label: string;
  description: string;
  isCheckedByDefault: boolean;
  questions: Question[];
}
