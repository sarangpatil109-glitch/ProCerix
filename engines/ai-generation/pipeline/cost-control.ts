import { createClient } from "@/lib/supabase/server";
import { AIProvider } from "../interfaces/ai-provider.interface";

export class CostControlEngine {
  // Normalize skill name to prevent duplicates (e.g., "AI PM" -> "ai-pm")
  static normalizeSkill(skillName: string): string {
    return skillName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Check if generation is globally paused
  static async isGenerationPaused(): Promise<boolean> {
    const supabase = await createClient();
    const { data } = await supabase.from("ai_governance_settings").select("value").eq("key", "generation_paused").single();
    return data?.value === true;
  }

  // Check for duplicate course
  static async findExistingCourse(skillName: string, courseType: string): Promise<string | null> {
    const supabase = await createClient();
    const normalized = this.normalizeSkill(skillName);
    
    // Check courses table (published, draft, archived)
    const { data: courses } = await supabase
      .from("courses")
      .select("id, slug")
      .eq("course_type", courseType);
      
    if (courses) {
       for (const course of courses) {
         if (course.slug.includes(normalized)) {
           return course.id;
         }
       }
    }
    
    return null;
  }

  // Log metrics and calculate estimated cost (Gemini 2.5 Flash: ~$0.075 / 1M tokens approx)
  static async logMetrics(
    requestId: string, 
    skillName: string, 
    provider: string, 
    promptTokens: number, 
    completionTokens: number, 
    generationTimeMs: number,
    wasReused: boolean,
    reusedCourseId?: string
  ) {
    const supabase = await createClient();
    
    const costPerToken = 0.0000001; // Estimate
    const estimatedCost = (promptTokens + completionTokens) * costPerToken;

    await supabase.from("ai_cost_metrics").insert({
      generation_request_id: requestId,
      skill_name: skillName,
      provider: provider,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: estimatedCost,
      generation_time_ms: generationTimeMs,
      was_reused: wasReused,
      reused_course_id: reusedCourseId
    });
  }
}
