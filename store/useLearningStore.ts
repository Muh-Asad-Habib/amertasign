import { create } from 'zustand';

import { learningModules } from '../constants/MockData';
import { Database } from '../services/database';
import { useAuthStore } from './useAuthStore';

interface LearningStoreState {
  completedModuleIds: string[];
  moduleProgress: Record<string, number>;
  completeModule: (id: string) => void;
  setProgress: (id: string, progress: number) => void;
  syncToDatabase: () => Promise<void>;
  isCompleted: (id: string) => boolean;
  getProgress: (id: string) => number;
}

const INITIAL_PROGRESS: Record<string, number> = {
  [learningModules[0]?.id ?? 'module-1']: 0.8,
  [learningModules[1]?.id ?? 'module-2']: 0.5,
  [learningModules[2]?.id ?? 'module-3']: 0.3,
};

const INITIAL_COMPLETED_IDS = learningModules.slice(0, 3).map((module) => module.id);

const clampProgress = (progress: number) => Math.max(0, Math.min(1, progress));
const getActiveUserId = () => useAuthStore.getState().user?.id ?? 'guest-user';

export const useLearningStore = create<LearningStoreState>((set, get) => ({
  completedModuleIds: INITIAL_COMPLETED_IDS,
  moduleProgress: INITIAL_PROGRESS,
  completeModule: (id) => {
    set((state) => {
      const alreadyCompleted = state.completedModuleIds.includes(id);

      return {
        completedModuleIds: alreadyCompleted
          ? state.completedModuleIds.filter((moduleId) => moduleId !== id)
          : [...state.completedModuleIds, id],
        moduleProgress: {
          ...state.moduleProgress,
          [id]: alreadyCompleted ? 0 : 1,
        },
      };
    });

    void get().syncToDatabase();
  },
  setProgress: (id, progress) => {
    const nextProgress = clampProgress(progress);

    set((state) => {
      const nextCompletedIds = nextProgress >= 1
        ? state.completedModuleIds.includes(id)
          ? state.completedModuleIds
          : [...state.completedModuleIds, id]
        : state.completedModuleIds.filter((moduleId) => moduleId !== id);

      return {
        completedModuleIds: nextCompletedIds,
        moduleProgress: {
          ...state.moduleProgress,
          [id]: nextProgress,
        },
      };
    });

    void get().syncToDatabase();
  },
  syncToDatabase: async () => {
    const { completedModuleIds, moduleProgress } = get();
    const userId = getActiveUserId();

    await Database.saveProgress(userId, { completedModuleIds, moduleProgress });
  },
  isCompleted: (id) => get().completedModuleIds.includes(id),
  getProgress: (id) => get().moduleProgress[id] ?? 0,
}));
