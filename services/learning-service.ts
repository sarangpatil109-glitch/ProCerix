import { LearningRepository } from "@/engines/learning/repository";
import { ModuleInput, LessonInput, ProgressInput } from "@/validators/learning";
import { createClient } from "@/lib/supabase/server";
import { sortModulesAndLessons } from "@/engines/learning/utils";

export class LearningService {
  static async getRepository(adminClient?: any) {
    const supabase = adminClient || await createClient();
    return new LearningRepository(supabase);
  }

  static async getCourseContent(courseId: string, adminClient?: any) {
    const repo = await this.getRepository(adminClient);
    const modules = await repo.getCourseContent(courseId);
    return sortModulesAndLessons(modules as any);
  }

  // Modules
  static async createModule(input: ModuleInput) {
    const repo = await this.getRepository();
    return repo.createModule(input);
  }

  static async updateModule(id: string, input: Partial<ModuleInput>) {
    const repo = await this.getRepository();
    return repo.updateModule(id, input);
  }

  static async deleteModule(id: string) {
    const repo = await this.getRepository();
    return repo.softDeleteModule(id);
  }

  // Lessons
  static async createLesson(input: LessonInput) {
    const repo = await this.getRepository();
    return repo.createLesson(input);
  }

  static async updateLesson(id: string, input: Partial<LessonInput>) {
    const repo = await this.getRepository();
    return repo.updateLesson(id, input);
  }

  static async deleteLesson(id: string) {
    const repo = await this.getRepository();
    return repo.softDeleteLesson(id);
  }

  // Progress
  static async getUserProgress(enrollmentId: string) {
    const repo = await this.getRepository();
    return repo.getUserProgress(enrollmentId);
  }

  static async updateProgress(input: ProgressInput) {
    const repo = await this.getRepository();
    return repo.upsertProgress(input);
  }
}
