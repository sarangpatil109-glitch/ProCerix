"use server";

import { courseSchema, type CourseInput } from "@/validators/course";
import { CourseService } from "@/services/course-service";
import { revalidateTag   } from "next/cache";

export async function createCourseAction(data: CourseInput) {
  const result = courseSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid course data" };
  }

  try {
    const course = await CourseService.createCourse(result.data);
    revalidateTag("courses", "default");
    return { success: true, data: course };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCourseAction(id: string, data: Partial<CourseInput>) {
  try {
    const course = await CourseService.updateCourse(id, data);
    revalidateTag("courses", "default");
    return { success: true, data: course };
  } catch (error: any) {
    return { error: error.message };
  }
}

  export async function archiveCourseAction(id: string) {
    try {
      await CourseService.archiveCourse(id);
      revalidateTag("courses", "default");
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }
