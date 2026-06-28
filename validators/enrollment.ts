import { z } from "zod";

export const createEnrollmentSchema = z.object({
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

export const updateEnrollmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "active", "completed", "expired", "cancelled", "dropped"]),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;
