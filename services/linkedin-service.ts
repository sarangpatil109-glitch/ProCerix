import { createClient } from "@/lib/supabase/server";
import { LinkedInRepository, LinkedInProfileData } from "@/engines/linkedin/repository";
import { calculateLinkedInScore } from "@/engines/linkedin/ats-scorer";

export class LinkedInService {
  static async getRepository() {
    const supabase = await createClient();
    return new LinkedInRepository(supabase);
  }

  static async getUserProfiles(userId: string) {
    const repo = await this.getRepository();
    return repo.getUserProfiles(userId);
  }

  static async getProfile(id: string, userId: string) {
    const repo = await this.getRepository();
    return repo.getProfile(id, userId);
  }

  static async createProfile(userId: string, title?: string) {
    const repo = await this.getRepository();
    return repo.createProfile(userId, title);
  }

  static async updateProfile(id: string, userId: string, updates: Partial<LinkedInProfileData>) {
    const repo = await this.getRepository();
    
    // Auto-calculate score
    const current = await repo.getProfile(id, userId);
    const merged = { ...current, ...updates };
    updates.profile_score = calculateLinkedInScore(merged);
    
    return repo.updateProfile(id, userId, updates);
  }

  static async deleteProfile(id: string, userId: string) {
    const repo = await this.getRepository();
    return repo.deleteProfile(id, userId);
  }
}
