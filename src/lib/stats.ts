import { useMemo } from 'react';

import { EXAM, questionsFor } from '@/lib/questions';
import type { StringKey } from '@/lib/i18n';
import { useApp } from '@/lib/store';

export function useStats() {
  const { progress, settings } = useApp();
  return useMemo(() => {
    const set = questionsFor(settings.state);
    let answered = 0;
    let correct = 0;
    let wrong = 0;
    let mastered = 0;
    for (const q of set) {
      const s = progress.stats[q.id];
      if (s?.r) answered++;
      if (s?.r === 1) correct++;
      if (s?.r === 2) wrong++;
      if (s?.r === 1 && s.b >= 2) mastered++;
    }
    const total = set.length;
    const exams = progress.exams;
    const passedExams = exams.filter((e) => e.score >= EXAM.passMark).length;
    const recent = exams.slice(0, 3);
    const recentAllPassed = recent.length === 3 && recent.every((e) => e.score >= EXAM.passMark);
    const ratio = total ? mastered / total : 0;
    const readiness: StringKey =
      ratio >= 0.85 && recentAllPassed
        ? 'readinessReady'
        : ratio >= 0.6
          ? 'readinessGood'
          : ratio >= 0.2
            ? 'readinessGrowing'
            : 'readinessStart';
    return { total, answered, correct, wrong, mastered, ratio, passedExams, examsTaken: exams.length, readiness };
  }, [progress, settings.state]);
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
