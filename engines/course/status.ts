import { CourseRow, CourseStatus, CourseVisibility } from "./types";

export function getCourseStatus(course: CourseRow): CourseStatus {
  if (course.deleted_at) {
    return "archived";
  }
  if (course.is_published) {
    return "published";
  }
  return "draft";
}

export function getCourseVisibility(course: CourseRow): CourseVisibility {
  return course.is_published ? "public" : "private";
}
