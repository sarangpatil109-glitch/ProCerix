import { AssessmentRepository } from "@/engines/assessment/repository";
import { StartAttemptInput, SubmitAttemptInput } from "@/validators/assessment";
import { createClient } from "@/lib/supabase/server";
import { calculateScore } from "@/engines/assessment/scoring";
import { canStartAttempt, isAttemptLocked } from "@/engines/assessment/rules";
import { AppError } from "@/utils/errors";

export class AssessmentService {
  static async getRepository() {
    const supabase = await createClient();
    return new AssessmentRepository(supabase);
  }

  static async getQuiz(quizId: string) {
    const repo = await this.getRepository();
    return repo.getQuizDetails(quizId);
  }

  static async startAttempt(input: StartAttemptInput) {
    const repo = await this.getRepository();
    const existingAttempts = await repo.getUserAttempts(input.enrollment_id, input.quiz_id);
    
    if (!canStartAttempt(existingAttempts as any)) {
      throw new AppError("Cannot start attempt. Max retries reached or already passed.", 403);
    }
    
    return repo.createAttempt(input);
  }

  static async submitAttempt(input: SubmitAttemptInput) {
    const repo = await this.getRepository();
    
    const attempt = await repo.getAttemptById(input.attempt_id);
    if (isAttemptLocked(attempt as any)) {
      throw new AppError("Attempt is locked or already submitted.", 403);
    }

    const quiz = await repo.getQuizDetails(attempt.quiz_id);
    
    const result = calculateScore(quiz as any, input.answers);
    
    return repo.submitAttempt(input.attempt_id, result);
  }
}
