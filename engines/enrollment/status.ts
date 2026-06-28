import { EnrollmentRow, EnrollmentStatus } from "./types";

export function determineEnrollmentStatus(enrollment: EnrollmentRow): EnrollmentStatus {
  return enrollment.status as EnrollmentStatus;
}
