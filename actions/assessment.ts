"use server";

import { startAttemptSchema, submitAttemptSchema, type StartAttemptInput, type SubmitAttemptInput } from "@/validators/assessment";
import { AssessmentService } from "@/services/assessment-service";
import { revalidateTag   } from "next/cache";

export async function startAttemptAction(data: StartAttemptInput) {
  const result = startAttemptSchema.safeParse(data);
  if (!result.success) return { error: "Invalid start attempt data" };

  try {
    const attempt = await AssessmentService.startAttempt(result.data);
    revalidateTag(`attempts-${data.enrollment_id}`, "default");
    return { success: true, data: attempt };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function submitAttemptAction(data: SubmitAttemptInput) {
  const result = submitAttemptSchema.safeParse(data);
  if (!result.success) return { error: "Invalid submission data" };

  try {
    const attemptResult = await AssessmentService.submitAttempt(result.data);
    
    revalidateTag("attempts", "default");
    
    return { success: true, data: attemptResult };
  } catch (error: any) {
    return { error: error.message };
  }
}
