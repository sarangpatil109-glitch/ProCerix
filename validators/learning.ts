import { z } from "zod";

export const moduleSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  sequence_order: z.number().min(1),
});

export const lessonSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().min(2, "Title is required"),
  content: z.string().optional(),
  estimated_reading_time: z.number().int().min(1).max(120).optional(),
  sequence_order: z.number().min(1),
});

export const progressSchema = z.object({
  enrollment_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  is_completed: z.boolean(),
});

export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
