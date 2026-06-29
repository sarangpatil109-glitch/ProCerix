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
      ai_governance_settings: {
        Row: { key: string; value: any; };
        Insert: any; Update: any; Relationships: [];
      };
      courses: {
        Row: {
          id: string; title: string; slug: string; course_type: string;
          is_published: boolean; created_at: string; description: string;
          deleted_at?: string; difficulty?: string; category?: string; price?: number;
          original_price?: number; discount?: number; thumbnail?: string;
          duration?: string; is_featured?: boolean; tags?: string[];
        };
        Insert: any; Update: any; Relationships: [];
      };
      profiles: {
        Row: { id: string; first_name: string; last_name: string; avatar_url?: string; bio?: string; created_at: string; is_suspended?: boolean; };
        Insert: any; Update: any; Relationships: [];
      };
      generation_queue: {
        Row: { 
          id: string; status: string; requested_by: string; skill_name: string; 
          slug: string; error_message?: string; created_at: string; completed_at?: string; course_id?: string;
        };
        Insert: any; Update: any; 
        Relationships: [
          {
            foreignKeyName: "generation_queue_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      certificates: {
        Row: {
          id: string; user_id: string; course_id: string;
          credential_id: string; issued_at: string; status: string;
          certificate_number: string; issue_date: string;
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
      quizzes: {
        Row: { id: string; module_id: string; title: string; passing_score: number; };
        Insert: any; Update: any; Relationships: [];
      };
      system_settings: {
        Row: { key: string; value: any; category?: string; };
        Insert: any; Update: any; Relationships: [];
      };
      payments: {
        Row: { 
          id: string; amount: number | string; status: string; created_at: string; user_id: string;
          cashfree_order_id?: string; skill_name?: string; course_slug?: string; paid_at?: string;
        };
        Insert: any; Update: any; 
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      internship_submissions: {
        Row: { id: string; status: string; };
        Insert: any; Update: any; Relationships: [];
      };
      enrollments: {
        Row: { id: string; course_id: string; user_id: string; enrolled_at: string; status: string; };
        Insert: any; Update: any;
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      admin_users: {
        Row: { id: string; role: string; created_at: string; };
        Insert: any; Update: any; 
        Relationships: [
          {
            foreignKeyName: "admin_users_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      lessons: {
        Row: { id: string; created_at: string; sequence_order: number; };
        Insert: any; Update: any; Relationships: [];
      };
      learning_modules: {
        Row: { id: string; created_at: string; sequence_order: number; };
        Insert: any; Update: any; Relationships: [];
      };
      prompt_templates: {
        Row: { id: string; created_at: string; name: string; type: string; };
        Insert: any; Update: any; Relationships: [];
      };
      prompt_versions: {
        Row: { id: string; template_id: string; version_number: number; };
        Insert: any; Update: any; Relationships: [];
      };
      generation_waitlist: {
        Row: { user_id: string; generation_id: string; };
        Insert: any; Update: any; Relationships: [];
      };
      internships: {
        Row: { id: string; title: string; };
        Insert: any; Update: any; Relationships: [];
      };
      internship_tasks: {
        Row: { id: string; internship_id: string; };
        Insert: any; Update: any; Relationships: [];
      };
      questions: {
        Row: { id: string; points: number; };
        Insert: any; Update: any; Relationships: [];
      };
      options: {
        Row: { id: string; is_correct: boolean; };
        Insert: any; Update: any; Relationships: [];
      };
      attempts: {
        Row: { id: string; quiz_id: string; started_at?: string; completed_at?: string; };
        Insert: any; Update: any; Relationships: [];
      };
      course_generation_requests: {
        Row: { id: string; payment_count: number; slug: string; status: string; };
        Insert: any; Update: any; Relationships: [];
      };
      progress: {
        Row: { lesson_id: string; is_completed: boolean; sequence_order: number; enrollment_id: string; };
        Insert: any; Update: any; Relationships: [];
      };
      api_keys: {
        Row: { id: string; key: string; user_id: string; key_hash: string; scopes?: any; is_active: boolean; };
        Insert: any; Update: any; Relationships: [];
      };
      api_audit_logs: {
        Row: { id: string; };
        Insert: any; Update: any; Relationships: [];
      };
      modules: {
        Row: { id: string; course_id: string; };
        Insert: any; Update: any; Relationships: [];
      };
      site_settings: {
        Row: {
          id: string; logo?: string; favicon?: string; site_name: string;
          primary_color?: string; secondary_color?: string; contact_email?: string;
          contact_phone?: string; footer_text?: string; facebook?: string;
          instagram?: string; linkedin?: string; youtube?: string;
          created_at?: string; updated_at?: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
      homepage_sections: {
        Row: {
          id: string; hero_title?: string; hero_subtitle?: string;
          hero_image?: string; hero_cta?: string; stats?: any;
          features?: any; testimonials?: any; faq?: any;
          created_at?: string; updated_at?: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
      banners: {
        Row: {
          id: string; title: string; subtitle?: string; button_text?: string;
          image_url?: string; link_url?: string; priority?: number;
          is_published?: boolean; created_at?: string; updated_at?: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
      coupons: {
        Row: {
          id: string; code: string; discount_amount: number; is_percentage?: boolean;
          expiry_date?: string; usage_limit?: number; usage_count?: number;
          min_amount?: number; is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
      certificate_settings: {
        Row: {
          id: string; prefix?: string; logo_url?: string; signature_url?: string;
          background_url?: string; qr_enabled?: boolean; created_at?: string; updated_at?: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
      posts: {
        Row: {
          id: string; title: string; slug: string; content?: string; excerpt?: string;
          thumbnail?: string; is_published?: boolean; author_id?: string;
          created_at?: string; updated_at?: string;
        };
        Insert: any; Update: any; Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      question_type: any;
      attempt_status: any;
      course_difficulty: any;
      generation_status: any;
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
