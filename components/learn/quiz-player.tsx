"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Trophy, RefreshCw, ChevronRight, ClipboardList } from "lucide-react";
import { submitQuizAttemptAction } from "@/actions/learning";
import { issueCertificateAction } from "@/actions/certificate";

type Option = { id: string; content: string; is_correct: boolean };
type Question = { id: string; content: string; points: number; options: Option[]; sequence_order: number };
type Quiz = {
  id: string;
  title: string;
  passing_score: number;
  questions: Question[];
};
type Attempt = { id: string; score: number | null; status: string; completed_at: string | null } | null;

export function QuizPlayer({
  quiz,
  courseSlug,
  enrollmentId,
  nextLessonId,
  isLastModule,
  userId,
  courseId,
  previousAttempt,
}: {
  quiz: Quiz;
  courseSlug: string;
  enrollmentId: string;
  nextLessonId: string | null;
  isLastModule: boolean;
  userId: string;
  courseId: string;
  previousAttempt: Attempt;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; correctCount: number; totalCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [certCredential, setCertCredential] = useState<string | null>(null);

  const alreadyPassed = previousAttempt?.status === "passed";

  const selectAnswer = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    let earnedPoints = 0;
    let correctCount = 0;

    for (const q of quiz.questions) {
      const selectedOptionId = answers[q.id];
      const correct = q.options.find(o => o.id === selectedOptionId)?.is_correct ?? false;
      if (correct) {
        earnedPoints += q.points || 1;
        correctCount++;
      }
    }

    const scorePercentage = Math.round((earnedPoints / Math.max(totalPoints, 1)) * 100);
    const passed = scorePercentage >= quiz.passing_score;

    await submitQuizAttemptAction({ enrollmentId, quizId: quiz.id, score: scorePercentage, passed });

    setResult({ score: scorePercentage, passed, correctCount, totalCount: quiz.questions.length });
    setSubmitted(true);
    setLoading(false);
  };

  const handleContinue = async () => {
    setLoading(true);
    if (isLastModule) {
      const res = await issueCertificateAction(userId, courseId);
      if (res.credentialId) {
        setCertCredential(res.credentialId);
        setLoading(false);
        return;
      }
    }
    if (nextLessonId) {
      router.push(`/learn/${courseSlug}/${nextLessonId}`);
    } else {
      router.push(`/course/${courseSlug}`);
    }
    setLoading(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setCertCredential(null);
  };

  if (certCredential) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Complete!</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">You&apos;ve earned your certificate.</p>
        <a
          href={`/verify/${certCredential}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-full shadow-lg transition-all"
        >
          <Trophy className="w-5 h-5" /> View Certificate
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-semibold">
          <ClipboardList className="w-4 h-4" />
          Module Quiz
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} &bull; Passing score: {quiz.passing_score}%
        </p>
        {alreadyPassed && !submitted && (
          <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> You already passed this quiz.
          </div>
        )}
      </div>

      {/* Result banner */}
      {submitted && result && (
        <div className={`rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 ${
          result.passed
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        }`}>
          {result.passed
            ? <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0" />
            : <XCircle className="w-10 h-10 text-red-500 shrink-0" />}
          <div className="flex-1 text-center sm:text-left">
            <p className={`text-xl font-bold ${result.passed ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
              {result.passed ? "Quiz Passed!" : "Quiz Failed"}
            </p>
            <p className={`text-sm mt-0.5 ${result.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              {result.correctCount} / {result.totalCount} correct &bull; Score: {result.score}% (need {quiz.passing_score}%)
            </p>
          </div>
          <div className="flex gap-3">
            {!result.passed && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            )}
            {result.passed && (
              <button
                onClick={handleContinue}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow transition-all disabled:opacity-60"
              >
                {isLastModule ? <Trophy className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {isLastModule ? "Get Certificate" : "Next Module"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {quiz.questions.map((question, qIdx) => {
          const selectedOptionId = answers[question.id];
          const correctOptionId = question.options.find(o => o.is_correct)?.id;
          const isAnsweredCorrectly = submitted && selectedOptionId === correctOptionId;
          const isAnsweredWrong = submitted && selectedOptionId && selectedOptionId !== correctOptionId;

          return (
            <div key={question.id} className="space-y-3">
              <p className="font-semibold text-gray-900 dark:text-white">
                <span className="text-gray-400 dark:text-gray-500 mr-2">{qIdx + 1}.</span>
                {question.content}
              </p>
              <div className="space-y-2">
                {question.options.map(option => {
                  const isSelected = selectedOptionId === option.id;
                  const showCorrect = submitted && option.is_correct;
                  const showWrong = submitted && isSelected && !option.is_correct;

                  return (
                    <button
                      key={option.id}
                      onClick={() => selectAnswer(question.id, option.id)}
                      disabled={submitted}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm ${
                        showCorrect
                          ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium"
                          : showWrong
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                          : isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      } disabled:cursor-default`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        showCorrect ? "border-green-500 bg-green-500"
                        : showWrong ? "border-red-500 bg-red-500"
                        : isSelected ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                      }`}>
                        {(showCorrect || (isSelected && !submitted)) && <span className="w-2 h-2 rounded-full bg-white" />}
                        {showWrong && <XCircle className="w-3.5 h-3.5 text-white" />}
                      </span>
                      {option.content}
                      {showCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className={`text-xs font-medium ${isAnsweredCorrectly ? "text-green-600 dark:text-green-400" : isAnsweredWrong ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}>
                  {isAnsweredCorrectly ? "Correct!" : isAnsweredWrong ? `Incorrect. Correct answer highlighted above.` : "Not answered."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <div className="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Object.keys(answers).length} / {quiz.questions.length} answered
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(answers).length < quiz.questions.length}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit Quiz"}
          </button>
        </div>
      )}

      {/* Already passed — quick continue */}
      {alreadyPassed && !submitted && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow transition-all disabled:opacity-60"
          >
            {isLastModule ? <Trophy className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {isLastModule ? "Get Certificate" : "Continue to Next Module"}
          </button>
        </div>
      )}
    </div>
  );
}
