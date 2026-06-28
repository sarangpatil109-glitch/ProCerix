import { ProgressCalculation, ModuleWithLessons } from "./types";

export function calculateProgress(totalLessons: number, completedLessons: number): ProgressCalculation {
  const safeTotal = totalLessons > 0 ? totalLessons : 1;
  const percentage = Math.round((completedLessons / safeTotal) * 100);
  
  return {
    totalLessons,
    completedLessons,
    progressPercentage: percentage > 100 ? 100 : percentage,
    isFullyCompleted: completedLessons >= totalLessons && totalLessons > 0,
  };
}

export function estimateDurationMinutes(content: string | null | undefined, hasVideo: boolean): number {
  let minutes = 0;
  
  if (content) {
    const wordCount = content.split(/\s+/).length;
    minutes += Math.ceil(wordCount / 200);
  }
  
  if (hasVideo) {
    minutes += 10;
  }
  
  return Math.max(1, minutes);
}

export function sortModulesAndLessons(modules: ModuleWithLessons[]): ModuleWithLessons[] {
  const sortedModules = [...modules].sort((a, b) => a.sequence_order - b.sequence_order);
  
  return sortedModules.map(mod => ({
    ...mod,
    lessons: [...mod.lessons].sort((a, b) => a.sequence_order - b.sequence_order)
  }));
}
