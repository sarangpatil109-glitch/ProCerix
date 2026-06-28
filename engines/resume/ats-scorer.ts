import { ResumeData } from "./repository";

export function calculateATSScore(resume: ResumeData): number {
  let score = 0;
  
  // 1. Missing sections (max 20 points)
  if (resume.personal_details?.email) score += 5;
  if (resume.personal_details?.phone) score += 5;
  if (resume.personal_details?.summary?.length > 50) score += 5;
  if (resume.personal_details?.linkedin || resume.personal_details?.github) score += 5;

  // 2. Education (max 15 points)
  if (resume.education?.length > 0) {
    score += 10;
    if (resume.education[0].institution && resume.education[0].degree) {
      score += 5;
    }
  }

  // 3. Experience (max 25 points)
  if (resume.experience?.length > 0) {
    score += 10;
    // Check if bullets exist and are well-formed
    const hasBullets = resume.experience.some(exp => exp.description?.length > 20);
    if (hasBullets) score += 15;
  }

  // 4. Projects (max 15 points)
  if (resume.projects?.length > 0) {
    score += 10;
    const hasProjectLinks = resume.projects.some(p => p.link);
    if (hasProjectLinks) score += 5;
  }

  // 5. Skills count & keywords (max 25 points)
  if (resume.skills?.length >= 5) score += 10;
  if (resume.skills?.length >= 10) score += 10;
  if (resume.skills?.length >= 15) score += 5; // Total 25

  // Total possible: 100 points
  
  return Math.min(100, Math.max(0, score));
}
