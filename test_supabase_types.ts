import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      ai_cost_metrics: {
        Row: {
          id: string; created_at: string; was_reused: boolean;
          estimated_cost_usd: string | number; prompt_tokens: number;
          completion_tokens: number; generation_time_ms: number; skill_name: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
      profiles: {
        Row: { first_name: string };
        Insert: any; Update: any; Relationships: [];
      };
      courses: {
        Row: { title: string };
        Insert: any; Update: any; Relationships: [];
      };
      certificates: {
        Row: {
          id: string; user_id: string; course_id: string;
          credential_id: string; issued_at: string; status: string;
        };
        Insert: any; Update: any;
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabase = createClient<Database>("https://test.co", "test");

async function test() {
  const { data } = await supabase.from("ai_cost_metrics").select("*");
  console.log(data?.[0].was_reused);

  const { data: certs } = await supabase.from("certificates").select("*, profiles!inner(first_name), courses!inner(title)");
  console.log(certs?.[0].profiles.first_name);
}
