import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { CourseInput } from "@/validators/course";
import { generateCourseSlug } from "./utils";
import { buildCourseQuery } from "./queries";
import { CourseFilter } from "./types";
import { withDefaultPricing } from "@/lib/pricing/defaults";

export class CourseRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getCourses(filter?: CourseFilter) {
    const query = buildCourseQuery(this.client, filter);
    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getCourseById(id: string) {
    const { data, error } = await this.client
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) throw error;
    return data;
  }

  async getCourseBySlug(slug: string) {
    const { data, error } = await this.client
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .single();
      
    if (error) throw error;
    return data;
  }

  async createCourse(input: CourseInput) {
    const slug = generateCourseSlug(input.title);
    const payload = withDefaultPricing({ ...input, slug }, (input as any).course_type);
    const { data, error } = await this.client
      .from("courses")
      .insert(payload as any)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateCourse(id: string, input: Partial<CourseInput>) {
    const { data, error } = await this.client
      .from("courses")
      .update({ ...input, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async softDeleteCourse(id: string) {
    const { error } = await this.client
      .from("courses")
      .update({ deleted_at: new Date().toISOString(), is_published: false } as any)
      .eq("id", id);
      
    if (error) throw error;
  }
}
