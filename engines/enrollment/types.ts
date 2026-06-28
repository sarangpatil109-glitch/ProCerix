import { Tables } from "@/types/supabase";

export type EnrollmentRow = Tables<"enrollments">;
export type EnrollmentStatus = "pending" | "active" | "completed" | "expired" | "cancelled" | "dropped";

export interface EnrollmentWithCourse extends EnrollmentRow {
  course: Tables<"courses">;
}
