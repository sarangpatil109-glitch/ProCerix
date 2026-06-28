import { Tables, Enums } from "@/types/supabase";

export type GenerationStatus = Enums<"generation_status">;
export type GenerationRequestRow = Tables<"course_generation_requests">;

export interface CreateGenerationInput {
  skill_name: string;
  slug: string;
  requested_by: string;
}
