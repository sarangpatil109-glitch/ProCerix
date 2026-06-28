import { CourseRepository } from "@/engines/course/repository";
import { CourseInput } from "@/validators/course";
import { createClient } from "@/lib/supabase/server";

export class CourseService {
  static async getRepository() {
    const supabase = await createClient();
    return new CourseRepository(supabase);
  }

  static async createCourse(input: CourseInput) {
    const repo = await this.getRepository();
    return repo.createCourse(input);
  }

  static async updateCourse(id: string, input: Partial<CourseInput>) {
    const repo = await this.getRepository();
    return repo.updateCourse(id, input);
  }

  static async archiveCourse(id: string) {
    const repo = await this.getRepository();
    return repo.softDeleteCourse(id);
  }
}
