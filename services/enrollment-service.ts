import { EnrollmentRepository } from "@/engines/enrollment/repository";
import { CreateEnrollmentInput, UpdateEnrollmentStatusInput } from "@/validators/enrollment";
import { createClient } from "@/lib/supabase/server";
import { validatePurchaseForEnrollment } from "@/engines/enrollment/purchase";
import { AppError } from "@/utils/errors";

export class EnrollmentService {
  static async getRepository() {
    const supabase = await createClient();
    return new EnrollmentRepository(supabase);
  }

  /**
   * Creates an enrollment record after a verified payment.
   * Pass adminClient to bypass RLS when called from webhook/payment context.
   */
  static async enrollUser(
    input: CreateEnrollmentInput,
    paymentStatus: string = "success",
    adminClient?: any,
  ) {
    if (!validatePurchaseForEnrollment(paymentStatus)) {
      throw new AppError("Payment validation failed. Cannot enroll.", 403);
    }

    const repo = adminClient
      ? new EnrollmentRepository(adminClient)
      : await this.getRepository();

    return repo.createEnrollment({ ...input, status: "active" });
  }

  static async getUserEnrollments(userId: string) {
    const repo = await this.getRepository();
    return repo.getUserEnrollments(userId);
  }

  static async checkAccess(userId: string, courseId: string) {
    const repo = await this.getRepository();
    return repo.getEnrollment(userId, courseId);
  }

  static async updateStatus(input: UpdateEnrollmentStatusInput) {
    const repo = await this.getRepository();
    return repo.updateEnrollmentStatus(input.id, input.status);
  }
}
