import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  price: z.number().min(0, "Price cannot be negative").default(0),
  is_published: z.boolean().default(false),
});

export type CourseInput = z.infer<typeof courseSchema>;
