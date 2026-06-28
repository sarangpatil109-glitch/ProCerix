import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export async function getById<T extends keyof Database['public']['Tables']>(
  client: SupabaseClient<Database>,
  table: T,
  id: string
) {
  const { data, error } = await client
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getAll<T extends keyof Database['public']['Tables']>(
  client: SupabaseClient<Database>,
  table: T,
  options?: { limit?: number; offset?: number }
) {
  let query = client.from(table).select("*");
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
