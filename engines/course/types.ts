import { Tables, Enums } from "@/types/supabase";

export type CourseRow = Tables<"courses">;
export type CourseDifficulty = Enums<"course_difficulty">;

export type CourseStatus = "draft" | "published" | "archived";
export type CourseVisibility = "public" | "private";

export interface CourseFilter {
  status?: CourseStatus;
  visibility?: CourseVisibility;
  difficulty?: CourseDifficulty;
  search?: string;
  category?: string;
  courseType?: "certificate" | "internship";
  isFree?: boolean;
  minDuration?: number;
  maxDuration?: number;
  sort?: "newest" | "popular" | "alphabetical";
  limit?: number;
  offset?: number;
}
