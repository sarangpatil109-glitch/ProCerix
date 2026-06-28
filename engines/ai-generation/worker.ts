import { createClient } from "@/lib/supabase/server";
import { AIProvider } from "./interfaces/ai-provider.interface";
import { PromptBuilder } from "./pipeline/prompt-builder";
import { GenerationValidator, CourseGenerationSchema } from "./pipeline/generation-validator";
import { StorageAdapter } from "./pipeline/storage-adapter";
import { GenerationLogger } from "./logger";
import { CostControlEngine } from "./pipeline/cost-control";

export class GenerationWorker {
  constructor(private provider: AIProvider) {}

  async processQueue() {
    if (!this.provider.isAvailable()) {
      throw new Error("AI Provider is currently unavailable");
    }

    if (await CostControlEngine.isGenerationPaused()) {
      console.log("[COST_CONTROL] Generation is paused. Skipping queue processing.");
      return false;
    }

    const supabase = await createClient();

    // 1. Locate pending/queued generation requests securely
    const { data: request, error: lockError } = await (supabase as any)
      .from("course_generation_requests")
      .select("*")
      .in("status", ["pending", "queued"])
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!request || lockError) return false;

    // 2. Lock request (Mark as Processing)
    const startTime = new Date().toISOString();
    await supabase.from("course_generation_requests")
      .update({ status: "generating", started_at: startTime } as any)
      .eq("id", request.id);

    await GenerationLogger.log(request.id, "started", { skill_name: request.skill_name });

    try {
      // 3. Orchestrate Prompt Generation
      const courseType = request.slug.includes("internship") ? "internship" : "certificate";
      
      // COST CONTROL: Check for duplicate course
      const existingCourseId = await CostControlEngine.findExistingCourse(request.skill_name, courseType);
      
      let courseId = existingCourseId;

      if (existingCourseId) {
        console.log(`[COST_CONTROL] Duplicate detected for ${request.skill_name}. Reusing course ${existingCourseId}`);
        await CostControlEngine.logMetrics(request.id, request.skill_name, "none", 0, 0, 0, true, existingCourseId);
      } else {
        const prompt = PromptBuilder.buildCoursePrompt(request.skill_name, courseType);

        // 4. Delegate to AI Provider (Abstract/Agnostic)
        const aiResponse = await this.provider.generateStructuredContent(prompt, CourseGenerationSchema);
        const rawPayload = aiResponse.data;

        // 5. Strict Zod Validation & Domain Rule Checks
        const validatedPayload = GenerationValidator.validate(rawPayload, courseType);

        // 6. Persist structured output dynamically to standard relational tables
        const course = await StorageAdapter.persistGeneratedCourse(request.skill_name, validatedPayload as any);
        courseId = course.id;

        await CostControlEngine.logMetrics(
           request.id, 
           request.skill_name, 
           aiResponse.meta.providerName, 
           aiResponse.meta.tokenUsage.prompt, 
           aiResponse.meta.tokenUsage.completion, 
           aiResponse.meta.generationTimeMs, 
           false
        );
        
        await GenerationLogger.log(request.id, "completed", { 
          course_id: course.id, 
          provider: aiResponse.meta.providerName,
          token_usage: aiResponse.meta.tokenUsage,
          generation_time_ms: aiResponse.meta.generationTimeMs
        });
      }



      // 7. Update status mapping
      await supabase.from("course_generation_requests")
        .update({ 
          status: "ready", 
          course_id: courseId,
          completed_at: new Date().toISOString() 
        } as any)
        .eq("id", request.id);

      // Notify Admin (Simulated)
      console.log(`[ADMIN_NOTIFICATION] Draft course ready for review: ${courseId}`);

      // 8. Resolve waitlist and auto-enroll students who paid while it generated
      const { data: waitlist } = await supabase.from("generation_waitlist").select("user_id").eq("generation_id", request.id);
      if (waitlist && waitlist.length > 0) {
        const enrollments = waitlist.map(w => ({
          user_id: w.user_id,
          course_id: courseId,
          status: "active"
        }));
        await supabase.from("enrollments").insert(enrollments as any);
      }

      return true;

    } catch (error: any) {
      await GenerationLogger.log(request.id, "failed", { error: error.message || "Unknown AI Generation Error" });

      // 9. Failure Recovery & Logging
      await supabase.from("course_generation_requests")
        .update({ 
          status: "failed", 
          failed_reason: error.message || "Unknown AI Generation Error",
          completed_at: new Date().toISOString()
        } as any)
        .eq("id", request.id);

      return false;
    }
  }
}
