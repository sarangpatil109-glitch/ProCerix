import { EnrollmentRow } from "./types";

export function hasEnrollmentExpired(enrollment: EnrollmentRow, validityDays?: number): boolean {
  if (!validityDays) return false;
  
  const enrolledDate = new Date(enrollment.enrolled_at).getTime();
  const currentDate = new Date().getTime();
  const diffDays = (currentDate - enrolledDate) / (1000 * 3600 * 24);
  
  return diffDays > validityDays;
}
