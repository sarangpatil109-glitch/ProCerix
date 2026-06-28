import { ProgressCalculation } from "@/engines/learning/types";

export function isEligibleForCompletion(progress: ProgressCalculation, requiredPercentage: number = 100): boolean {
  return progress.progressPercentage >= requiredPercentage;
}
