import { useMemo } from 'react';

import { learningModules } from '../constants/MockData';
import { useLearningStore } from '../store/useLearningStore';
import type { LearningLevel, LearningModule } from '../types';

type LearningLevelFilter = LearningLevel | 'semua';

type LearningModuleWithProgress = LearningModule & {
  progress: number;
  completed: boolean;
};

export function useLearning(level: LearningLevelFilter = 'semua') {
  const completedModuleIds = useLearningStore((state) => state.completedModuleIds);
  const completeModule = useLearningStore((state) => state.completeModule);
  const setProgress = useLearningStore((state) => state.setProgress);
  const isCompleted = useLearningStore((state) => state.isCompleted);
  const getProgress = useLearningStore((state) => state.getProgress);

  const filteredModules = useMemo<LearningModuleWithProgress[]>(() => {
    return learningModules
      .filter((module) => level === 'semua' || module.level === level)
      .map((module) => ({
        ...module,
        progress: getProgress(module.id),
        completed: isCompleted(module.id),
      }));
  }, [getProgress, isCompleted, level]);

  const total = learningModules.length;
  const completed = completedModuleIds.length;
  const percentage = total === 0 ? 0 : completed / total;

  return {
    allModules: learningModules,
    filteredModules,
    completionStats: {
      total,
      completed,
      percentage,
    },
    completeModule,
    setProgress,
    isCompleted,
    getProgress,
  };
}

export type { LearningLevelFilter, LearningModuleWithProgress };
