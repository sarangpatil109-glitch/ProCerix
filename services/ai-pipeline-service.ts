import { createClient } from "@/lib/supabase/server";
import { EnrollmentService } from "@/services/enrollment-service";
import { getDefaultPricing } from "@/lib/pricing/defaults";

export class AIPipelineService {
  /**
   * Process pending AI generations.
   * Lock duplicate requests, validate, generate, and draft.
   */
  static async processQueue() {
    const supabase = await createClient();

    // 1. Fetch pending requests
    const { data: pendingRequests } = await supabase
      .from("generation_queue")
      .select("*")
      .eq("status", "pending")
      .limit(5); // Process in small batches

    if (!pendingRequests || pendingRequests.length === 0) {
      return { processed: 0 };
    }

    let processedCount = 0;

    for (const request of pendingRequests) {
      // 2. Lock the request
      const { data: lockedReq, error: lockError } = await supabase
        .from("generation_queue")
        .update({ status: "processing", updated_at: new Date().toISOString() as any })
        .eq("id", request.id)
        .eq("status", "pending") // optimistic locking
        .select()
        .single();

      if (lockError || !lockedReq) continue; // Someone else grabbed it

      try {
        // 3. Generate Draft (Mock AI logic for now)
        // In a real scenario, this calls OpenAI/Anthropic
        const courseData = {
          title: request.skill_name,
          slug: request.slug,
          description: `Comprehensive AI-generated course for ${request.skill_name}.`,
          course_type: "certificates",
          ...getDefaultPricing("certificates"),
          is_published: false // Needs admin review
        };

        const { data: newCourse, error: courseError } = await supabase
          .from("courses")
          .insert(courseData)
          .select()
          .single();

        if (courseError) throw courseError;

        // 4. Create dummy modules/lessons for the draft
        await supabase.from("modules").insert({
          course_id: newCourse.id,
          title: "Introduction",
          description: "Getting started",
          order_index: 1
        } as any);

        // 5. Update Queue Request
        await supabase
          .from("generation_queue")
          .update({
            status: "review",
            course_id: newCourse.id,
            completed_at: new Date().toISOString() as any,
            updated_at: new Date().toISOString() as any
          })
          .eq("id", request.id);

        // 6. Link Student Enrollment & Update Progress
        // Users who paid for it should automatically get enrolled in the draft so they can access it once published
        if (request.requested_by) {
          await EnrollmentService.enrollUser({
            user_id: request.requested_by,
            course_id: newCourse.id
          });
        }

        processedCount++;
      } catch (error: any) {
        // Mark as failed
        await supabase
          .from("generation_queue")
          .update({
            status: "failed",
            error_message: error.message,
            updated_at: new Date().toISOString() as any
          })
          .eq("id", request.id);
      }
    }

    return { processed: processedCount };
  }

  static async retryFailedJob(jobId: string) {
    const supabase = await createClient();
    await supabase
      .from("generation_queue")
      .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() as any })
      .eq("id", jobId)
      .eq("status", "failed");
  }

  static async cancelJob(jobId: string) {
    const supabase = await createClient();
    await supabase
      .from("generation_queue")
      .update({ status: "cancelled", updated_at: new Date().toISOString() as any })
      .eq("id", jobId);
  }

  static async getPipelineStats() {
    const supabase = await createClient();
    
    // Using Promise.all for concurrent counts
    const [pending, processing, review, failed, completed] = await Promise.all([
      supabase.from("generation_queue").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("generation_queue").select("id", { count: "exact" }).eq("status", "processing"),
      supabase.from("generation_queue").select("id", { count: "exact" }).eq("status", "review"),
      supabase.from("generation_queue").select("id", { count: "exact" }).eq("status", "failed"),
      supabase.from("generation_queue").select("id", { count: "exact" }).eq("status", "completed"),
    ]);

    return {
      pending: pending.count || 0,
      processing: processing.count || 0,
      review: review.count || 0,
      failed: failed.count || 0,
      completed: completed.count || 0
    };
  }
}
