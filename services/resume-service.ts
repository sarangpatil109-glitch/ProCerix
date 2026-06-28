import { createClient } from "@/lib/supabase/server";
import { ResumeRepository, ResumeData } from "@/engines/resume/repository";
import { calculateATSScore } from "@/engines/resume/ats-scorer";

export class ResumeService {
  static async getRepository() {
    const supabase = await createClient();
    return new ResumeRepository(supabase);
  }

  static async getUserResumes(userId: string) {
    const repo = await this.getRepository();
    return repo.getUserResumes(userId);
  }

  static async getResume(id: string, userId: string) {
    const repo = await this.getRepository();
    return repo.getResume(id, userId);
  }

  static async createResume(userId: string, title?: string) {
    const repo = await this.getRepository();
    return repo.createResume(userId, title);
  }

  static async updateResume(id: string, userId: string, updates: Partial<ResumeData>) {
    const repo = await this.getRepository();
    
    // Auto-calculate ATS score if sections changed
    if (updates.personal_details || updates.education || updates.experience || updates.projects || updates.skills) {
      // We need the full resume to calculate accurately. For now, fetch current to merge.
      const current = await repo.getResume(id, userId);
      const merged = { ...current, ...updates };
      updates.ats_score = calculateATSScore(merged);
    }
    
    return repo.updateResume(id, userId, updates);
  }

  static async deleteResume(id: string, userId: string) {
    const repo = await this.getRepository();
    return repo.deleteResume(id, userId);
  }
}
