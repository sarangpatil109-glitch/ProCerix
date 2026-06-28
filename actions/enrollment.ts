"use server";

import { createEnrollmentSchema, updateEnrollmentStatusSchema, type CreateEnrollmentInput, type UpdateEnrollmentStatusInput } from "@/validators/enrollment";
import { EnrollmentService } from "@/services/enrollment-service";
import { revalidateTag } from "next/cache";

export async function createEnrollmentAction(data: CreateEnrollmentInput) {
  const result = createEnrollmentSchema.safeParse(data);
  if (!result.success) return { error: "Invalid enrollment data" };

  try {
    const enrollment = await EnrollmentService.enrollUser(result.data);
    revalidateTag("enrollments");
    return { success: true, data: enrollment };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateEnrollmentStatusAction(data: UpdateEnrollmentStatusInput) {
  const result = updateEnrollmentStatusSchema.safeParse(data);
  if (!result.success) return { error: "Invalid status data" };

  try {
    const enrollment = await EnrollmentService.updateStatus(result.data);
    revalidateTag("enrollments");
    return { success: true, data: enrollment };
  } catch (error: any) {
    return { error: error.message };
  }
}
