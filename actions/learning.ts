"use server";

import { moduleSchema, lessonSchema, progressSchema, type ModuleInput, type LessonInput, type ProgressInput } from "@/validators/learning";
import { LearningService } from "@/services/learning-service";
import { revalidateTag   } from "next/cache";

export async function createModuleAction(data: ModuleInput) {
  const result = moduleSchema.safeParse(data);
  if (!result.success) return { error: "Invalid module data" };

  try {
    const module = await LearningService.createModule(result.data);
    revalidateTag(`course-content-${data.course_id}`, "default");
    return { success: true, data: module };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateModuleAction(id: string, courseId: string, data: Partial<ModuleInput>) {
  try {
    const module = await LearningService.updateModule(id, data);
    revalidateTag(`course-content-${courseId}`, "default");
    return { success: true, data: module };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createLessonAction(data: LessonInput, courseId: string) {
  const result = lessonSchema.safeParse(data);
  if (!result.success) return { error: "Invalid lesson data" };

  try {
    const lesson = await LearningService.createLesson(result.data);
    revalidateTag(`course-content-${courseId}`, "default");
    return { success: true, data: lesson };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateLessonAction(id: string, courseId: string, data: Partial<LessonInput>) {
  try {
    const lesson = await LearningService.updateLesson(id, data);
    revalidateTag(`course-content-${courseId}`, "default");
    return { success: true, data: lesson };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProgressAction(data: ProgressInput) {
  const result = progressSchema.safeParse(data);
  if (!result.success) return { error: "Invalid progress data" };

  try {
    const progress = await LearningService.updateProgress(result.data);
    revalidateTag(`progress-${data.enrollment_id}`, "default");
    return { success: true, data: progress };
  } catch (error: any) {
    return { error: error.message };
  }
}
