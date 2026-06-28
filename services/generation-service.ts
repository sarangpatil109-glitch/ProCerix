import { GenerationRepository } from "@/engines/generation/repository";
import { createClient } from "@/lib/supabase/server";
import { CourseService } from "@/services/course-service";
import { EnrollmentService } from "@/services/enrollment-service";

export class GenerationService {
  static async getRepository() {
    const supabase = await createClient();
    return new GenerationRepository(supabase);
  }

  /**
   * Called during payment success webhook/callback
   * Independent of payment provider (Stripe, Cashfree, etc.)
   */
  static async handleCoursePurchase(userId: string, slug: string, skillName: string, paymentStatus: string = "success") {
    if (paymentStatus !== "success") return null;

    // 1. Check if course already exists in the main database
    const courseRepo = await CourseService.getRepository();
    const existingCourse = await courseRepo.getCourseBySlug(slug).catch(() => null);

    if (existingCourse) {
      // Enroll user normally
      return await EnrollmentService.enrollUser({
        user_id: userId,
        course_id: existingCourse.id
      });
    }

    const { ProductRegistry } = await import("@/engines/registry/product-registry");
    const product = ProductRegistry.getProductBySlug(slug);

    if (product && !product.useAI) {
      // For products that don't use AI (e.g., HR Directory), instantiate them immediately in DB
      const supabase = await createClient();
      const { data: newCourse, error } = await (supabase as any)
        .from("courses")
        .insert({
          title: product.name,
          slug: product.slug,
          course_type: product.id,
          price: product.defaultPrice,
          is_published: true,
          description: product.features.join(", ")
        })
        .select()
        .single();
        
      if (!error && newCourse) {
        return await EnrollmentService.enrollUser({
          user_id: userId,
          course_id: newCourse.id
        });
      }
    }

    // 2. Course does not exist, queue generation
    const genRepo = await this.getRepository();
    const request = await genRepo.createOrJoinRequest({
      skill_name: skillName,
      slug,
      requested_by: userId
    });

    // Return success instantly. Generation runs asynchronously.
    return {
      generation_queued: true,
      request_id: request.id,
      status: request.status
    };
  }
}
