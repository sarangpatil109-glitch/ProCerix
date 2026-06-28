import { AttemptRow } from "./types";

export function canStartAttempt(attempts: AttemptRow[], maxRetries: number = 3): boolean {
  const passedAttempts = attempts.filter(a => (a as any).status === "passed");
  if (passedAttempts.length > 0) {
    return false; // Already passed
  }

  const inProgressAttempts = attempts.filter(a => (a as any).status === "in_progress");
  if (inProgressAttempts.length > 0) {
    return false; // Complete the current attempt first
  }

  if (attempts.length >= maxRetries) {
    return false; // Max retries exceeded
  }

  return true;
}

export function isAttemptLocked(attempt: AttemptRow): boolean {
  return (attempt as any).status !== "in_progress" || attempt.completed_at !== null;
}

export function hasTimeLimitExpired(attempt: AttemptRow, timeLimitMinutes: number): boolean {
  if (!attempt.started_at) return false;
  
  const startTime = new Date(attempt.started_at).getTime();
  const currentTime = new Date().getTime();
  
  const diffMinutes = (currentTime - startTime) / 1000 / 60;
  return diffMinutes > timeLimitMinutes;
}
