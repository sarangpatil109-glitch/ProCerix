import { Tables, Enums } from "@/types/supabase";

export type QuizRow = Tables<"quizzes">;
export type QuestionRow = Tables<"questions">;
export type OptionRow = Tables<"options">;
export type AttemptRow = Tables<"attempts">;
export type QuestionType = Enums<"question_type">;
export type AttemptStatus = Enums<"attempt_status">;

export interface QuestionWithOptions extends QuestionRow {
  options: OptionRow[];
}

export interface QuizWithQuestions extends QuizRow {
  questions: QuestionWithOptions[];
}

export interface AnswerSubmission {
  questionId: string;
  selectedOptionIds: string[];
}

export interface AssessmentResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  status: AttemptStatus;
}
