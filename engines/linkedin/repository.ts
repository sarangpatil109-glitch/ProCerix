export interface LinkedInProfileData {
  id?: string;
  user_id?: string;
  title: string;
  basic_info: any;
  headline: string;
  about: string;
  experience: any[];
  education: any[];
  projects: any[];
  skills: any[];
  certifications: any[];
  recommendations: any[];
  custom_url: string;
  profile_score?: number;
  updated_at?: string;
}

export class LinkedInRepository {
  constructor(public supabase: any) {}

  async getUserProfiles(userId: string) {
    const { data, error } = await this.supabase
      .from("linkedin_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getProfile(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("linkedin_profiles")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  async createProfile(userId: string, title: string = "Untitled Profile") {
    const { data, error } = await this.supabase
      .from("linkedin_profiles")
      .insert({
        user_id: userId,
        title,
        basic_info: {},
        headline: "",
        about: "",
        experience: [],
        education: [],
        projects: [],
        skills: [],
        certifications: [],
        recommendations: [],
        custom_url: ""
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(id: string, userId: string, updates: Partial<LinkedInProfileData>) {
    const { data, error } = await this.supabase
      .from("linkedin_profiles")
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

  async deleteProfile(id: string, userId: string) {
    const { error } = await this.supabase
      .from("linkedin_profiles")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return true;
  }
}
