import { LinkedInProfileData } from "./repository";

export function calculateLinkedInScore(profile: LinkedInProfileData): number {
  let score = 0;
  
  // 1. Basic Info & URL (max 15)
  if (profile.basic_info?.name) score += 5;
  if (profile.basic_info?.location) score += 5;
  if (profile.custom_url?.length > 10) score += 5;

  // 2. Headline (max 15)
  if (profile.headline?.length > 10) {
    score += 5;
    if (profile.headline.includes('|') || profile.headline.includes('-')) score += 10; // ATS keywords separated
  }

  // 3. About (max 15)
  if (profile.about?.length > 50) {
    score += 10;
    if (profile.about.length > 200) score += 5;
  }

  // 4. Experience (max 20)
  if (profile.experience?.length > 0) {
    score += 10;
    const hasDetails = profile.experience.some(e => e.description?.length > 50);
    if (hasDetails) score += 10;
  }

  // 5. Skills (max 15)
  if (profile.skills?.length >= 5) score += 5;
  if (profile.skills?.length >= 15) score += 10;

  // 6. Education, Certs, Projects (max 20)
  if (profile.education?.length > 0) score += 5;
  if (profile.certifications?.length > 0) score += 10;
  if (profile.projects?.length > 0) score += 5;

  return Math.min(100, Math.max(0, score));
}
