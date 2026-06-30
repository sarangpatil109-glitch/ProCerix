import { z } from "zod";

export const CourseGenerationSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  category: z.string(),
  course_type: z.enum(["certificate", "internship"]),
  modules: z.array(z.object({
    title: z.string(),
    description: z.string(),
    sequence_order: z.number(),
    lessons: z.array(z.object({
      title: z.string(),
      content: z.string().min(50),
      sequence_order: z.number(),
    })).min(1)
  })).min(2).max(5),
  mcqs: z.array(z.object({
    question: z.string(),
    options: z.array(z.object({
      content: z.string(),
      is_correct: z.boolean()
    })).length(4),
    points: z.number().default(1)
  })).length(10),
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    sequence_order: z.number()
  })).optional()
});

export class GenerationValidator {
  static validate(payload: any, type: "certificate" | "internship") {
    const result = CourseGenerationSchema.safeParse(payload);
    
    if (!result.success) {
      throw new Error(`Generation Schema Validation Failed: ${result.error.message}`);
    }

    const data = result.data;
    const totalLessons = data.modules.reduce((acc, m) => acc + m.lessons.length, 0);

    // Business Constraints Validation
    if (type === "certificate" && (totalLessons < 5 || totalLessons > 8)) {
      throw new Error("Certificate must have between 5 and 8 lessons");
    }

    if (type === "internship") {
      if (totalLessons < 10 || totalLessons > 15) {
         throw new Error("Internship must have between 10 and 15 lessons");
      }
      if (!data.tasks || data.tasks.length !== 3) {
         throw new Error("Internship must have exactly 3 tasks");
      }
    }

    // Duplicate Lesson Detection
    const lessonTitles = new Set();
    for (const courseModule of data.modules) {
      for (const lesson of courseModule.lessons) {
        if (lessonTitles.has(lesson.title)) {
           throw new Error(`Duplicate lesson title detected: ${lesson.title}`);
        }
        lessonTitles.add(lesson.title);
      }
    }

    return data;
  }
}
