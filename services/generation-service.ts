import { GenerationRepository } from "@/engines/generation/repository";
import { createClient } from "@/lib/supabase/server";
import { EnrollmentService } from "@/services/enrollment-service";
import { getDefaultPricing } from "@/lib/pricing/defaults";

export class GenerationService {
  static async getRepository() {
    const supabase = await createClient();
    return new GenerationRepository(supabase);
  }

  /**
   * Called during payment success — creates enrollment or queues AI generation.
   * Pass adminClient from PaymentService so RLS is bypassed in webhook context.
   */
  static async handleCoursePurchase(
    userId: string,
    slug: string,
    skillName: string,
    paymentStatus: string = "success",
    adminClient?: any,
  ) {
    if (paymentStatus !== "success") return null;

    const supabase = adminClient || await createClient();

    // Check if a real course already exists for this slug
    const { data: existingCourse, error: courseErr } = await supabase
      .from("courses")
      .select("id, slug")
      .eq("slug", slug)
      .is("deleted_at", null)
      .limit(1)
      .single();

    if (!courseErr && existingCourse) {
      return await EnrollmentService.enrollUser(
        { user_id: userId, course_id: existingCourse.id },
        "success",
        adminClient,
      );
    }

    // Check product registry for non-AI products (HR Directory, etc.)
    const { ProductRegistry } = await import("@/engines/registry/product-registry");
    const product = ProductRegistry.getProductBySlug(slug);

    if (product && !product.useAI) {
      const { data: upsertedCourse } = await supabase
        .from("courses")
        .upsert(
          {
            title: product.name,
            slug: product.slug,
            course_type: product.id,
            ...getDefaultPricing(product.id),
            is_published: true,
            description: product.features.join(", "),
          } as any,
          { onConflict: "slug" },
        )
        .select()
        .single();

      if (upsertedCourse) {
        return await EnrollmentService.enrollUser(
          { user_id: userId, course_id: upsertedCourse.id },
          "success",
          adminClient,
        );
      }
    }

    // Course doesn't exist yet — queue AI generation
    const genRepo = adminClient
      ? new GenerationRepository(adminClient)
      : await this.getRepository();

    const request = await genRepo.createOrJoinRequest({
      skill_name: skillName,
      slug,
      requested_by: userId,
    });

    return { generation_queued: true, request_id: request.id, status: request.status };
  }
}
