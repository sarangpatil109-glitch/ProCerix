import { QuizWithQuestions, AnswerSubmission, AssessmentResult } from "./types";

export function calculateScore(
  quiz: QuizWithQuestions,
  submissions: AnswerSubmission[]
): AssessmentResult {
  let score = 0;
  let maxScore = 0;

  for (const question of quiz.questions) {
    maxScore += question.points;
    
    const submission = submissions.find(s => s.questionId === question.id);
    if (!submission) continue;

    const correctOptionIds = question.options.filter(o => o.is_correct).map(o => o.id);
    const selectedIds = submission.selectedOptionIds;

    // Strict scoring: must select all correct options and no incorrect options
    if (correctOptionIds.length === selectedIds.length) {
      const isCompletelyCorrect = correctOptionIds.every(id => selectedIds.includes(id));
      if (isCompletelyCorrect) {
        score += question.points;
      }
    }
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = percentage >= quiz.passing_score;
  const status = passed ? "passed" : "failed";

  return {
    score,
    maxScore,
    percentage,
    passed,
    status
  };
}
