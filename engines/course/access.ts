import { CourseRow } from "./types";

export function canAccessCourse(course: CourseRow, userRole: string = "user"): boolean {
  if (userRole === "admin") return true;
  
  if (course.deleted_at) return false;
  
  if (course.is_published) return true; // public
  
  return false;
}
