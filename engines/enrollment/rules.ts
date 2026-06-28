import { EnrollmentRow, EnrollmentStatus } from "./types";
import { CourseRow } from "@/engines/course/types";

export function canAccessCourseContent(enrollment: EnrollmentRow | null, course: CourseRow): boolean {
  if (!enrollment) return false;
  
  const validStatuses: EnrollmentStatus[] = ["active", "completed"];
  return validStatuses.includes(enrollment.status as EnrollmentStatus);
}

export function isEnrollmentValid(enrollment: EnrollmentRow): boolean {
  return enrollment.status === "active";
}
