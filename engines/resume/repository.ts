export type ResumeSection = "personal_details" | "education" | "experience" | "projects" | "skills" | "certifications" | "languages";

export interface ResumeData {
  id?: string;
  user_id?: string;
  title: string;
  template_id: string;
  personal_details: any;
  education: any[];
  experience: any[];
  projects: any[];
  skills: any[];
  certifications: any[];
  languages: any[];
  ats_score?: number;
  updated_at?: string;
}

export class ResumeRepository {
  constructor(public supabase: any) {}

  async getUserResumes(userId: string) {
    const { data, error } = await this.supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getResume(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  async createResume(userId: string, title: string = "Untitled Resume") {
    const { data, error } = await this.supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title,
        template_id: "modern",
        personal_details: {},
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certifications: [],
        languages: []
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateResume(id: string, userId: string, updates: Partial<ResumeData>) {
    const { data, error } = await this.supabase
      .from("resumes")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteResume(id: string, userId: string) {
    const { error } = await this.supabase
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return true;
  }
}
