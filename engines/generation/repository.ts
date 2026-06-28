import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { CreateGenerationInput } from "./types";

export class GenerationRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getRequestBySlug(slug: string) {
    const { data, error } = await this.client
      .from("course_generation_requests")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createOrJoinRequest(input: CreateGenerationInput) {
    let request = await this.getRequestBySlug(input.slug);

    if (request) {
      // Increment payment count if someone else bought the same pending skill
      const { data, error } = await this.client
        .from("course_generation_requests")
        .update({ payment_count: request.payment_count + 1, updated_at: new Date().toISOString() } as any)
        .eq("id", request.id)
        .select()
        .single();
      
      if (error) throw error;
      request = data;
    } else {
      // Create new generation request
      const { data, error } = await this.client
        .from("course_generation_requests")
        .insert({
          skill_name: input.skill_name,
          slug: input.slug,
          requested_by: input.requested_by,
          status: "queued"
        } as any)
        .select()
        .single();
        
      if (error) throw error;
      request = data;
    }

    // Attach user to waitlist
    await this.client.from("generation_waitlist").upsert({
      generation_id: request.id,
      user_id: input.requested_by
    } as any, { onConflict: 'generation_id, user_id' });

    return request;
  }
  
  async updateStatus(id: string, status: string, courseId?: string) {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (courseId) updateData.course_id = courseId;
    if (status === 'ready' || status === 'failed') updateData.completed_at = new Date().toISOString();
    if (status === 'generating') updateData.started_at = new Date().toISOString();

    const { data, error } = await this.client
      .from("course_generation_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}
