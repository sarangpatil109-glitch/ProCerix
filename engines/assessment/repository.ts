import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { QuizInput, QuestionInput, OptionInput, StartAttemptInput } from "@/validators/assessment";
import { buildQuizQuery, buildUserAttemptsQuery } from "./queries";
import { AssessmentResult } from "./types";

export class AssessmentRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getQuizDetails(quizId: string) {
    const { data, error } = await buildQuizQuery(this.client, quizId);
    if (error) throw error;
    return data;
  }

  async createQuiz(input: QuizInput) {
    const { data, error } = await this.client
      .from("quizzes")
      .insert(input as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createQuestion(input: QuestionInput) {
    const { data, error } = await this.client
      .from("questions")
      .insert(input as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createOption(input: OptionInput) {
    const { data, error } = await this.client
      .from("options")
      .insert(input as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getUserAttempts(enrollmentId: string, quizId: string) {
    const { data, error } = await buildUserAttemptsQuery(this.client, enrollmentId, quizId);
    if (error) throw error;
    return data;
  }

  async getAttemptById(attemptId: string) {
    const { data, error } = await this.client
      .from("attempts")
      .select("*")
      .eq("id", attemptId)
      .single();
    if (error) throw error;
    return data;
  }

  async createAttempt(input: StartAttemptInput) {
    const { data, error } = await this.client
      .from("attempts")
      .insert({ ...input, status: "in_progress" } as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async submitAttempt(attemptId: string, result: AssessmentResult) {
    const { data, error } = await this.client
      .from("attempts")
      .update({
        score: result.percentage,
        status: result.status,
        completed_at: new Date().toISOString(),
      } as any)
      .eq("id", attemptId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
