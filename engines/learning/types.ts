import { Tables } from "@/types/supabase";

export type ModuleRow = Tables<"learning_modules">;
export type LessonRow = Tables<"lessons">;
export type ProgressRow = Tables<"progress">;

export interface ModuleWithLessons extends ModuleRow {
  lessons: LessonRow[];
}

export interface CourseLearningContent {
  modules: ModuleWithLessons[];
  totalLessons: number;
}

export interface ProgressCalculation {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isFullyCompleted: boolean;
}
