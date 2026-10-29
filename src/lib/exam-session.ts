import { drawExam, type StateCode } from '@/lib/questions';

export type ExamSession = {
  ids: string[];
  answers: (number | null)[];
  startedAt: number;
  finishedAt?: number;
};

let current: ExamSession | null = null;

export function startExam(state: StateCode): ExamSession {
  const ids = drawExam(state);
  current = { ids, answers: ids.map(() => null), startedAt: Date.now() };
  return current;
}

export const getExam = () => current;
