import { z } from "zod";

export const quizSchema = z.object({
  module_id: z.string().uuid().optional(),
  title: z.string().min(2, "Title is required"),
  passing_score: z.number().min(0).max(100).default(70),
});

export const questionSchema = z.object({
  quiz_id: z.string().uuid(),
  type: z.enum(['single_choice', 'multiple_choice', 'text']).default('single_choice'),
  content: z.string().min(1, "Question content is required"),
  points: z.number().min(1).default(1),
  sequence_order: z.number().min(1),
});

export const optionSchema = z.object({
  question_id: z.string().uuid(),
  content: z.string().min(1, "Option content is required"),
  is_correct: z.boolean().default(false),
});

export const startAttemptSchema = z.object({
  enrollment_id: z.string().uuid(),
  quiz_id: z.string().uuid(),
});

export const submitAttemptSchema = z.object({
  attempt_id: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOptionIds: z.array(z.string().uuid()),
  })),
});

export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type OptionInput = z.infer<typeof optionSchema>;
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
