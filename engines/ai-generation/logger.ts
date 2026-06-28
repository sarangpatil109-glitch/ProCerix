import { createClient } from "@/lib/supabase/server";

export class GenerationLogger {
  static async log(requestId: string, event: "started" | "completed" | "failed" | "retried", payload?: any) {
    // In a real production environment, this would insert into a time-series DB or specialized logging table.
    // We simulate logging by maintaining clean structured console outputs and inserting into Supabase generic logs if available.
    console.log(`[GENERATION_WORKER] [${new Date().toISOString()}] ${event.toUpperCase()} - Request ${requestId}`);
    if (payload) {
      console.log(JSON.stringify(payload, null, 2));
    }

    try {
      const supabase = await createClient();
      
      if (event === "failed" && payload?.error) {
        await supabase.from("course_generation_requests")
          .update({ failed_reason: payload.error } as any)
          .eq("id", requestId);
      }
      
      // If we had a JSONB meta column in course_generation_requests, we could store tokens & providers there.
      // Assuming a robust logging system would index this separately.
    } catch (e) {
      console.error("Logger failed to write to DB", e);
    }
  }
}
