import { Metadata } from "next";
import { SettingsService } from "@/services/settings-service";
import { APP_CONFIG } from "@/constants";

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await SettingsService.getSetting("platform_name", APP_CONFIG.name);
  return {
    title: `About Us | ${siteName}`,
    description: `Learn more about ${siteName} and our mission.`
  };
}

export default async function AboutPage() {
  const siteName = await SettingsService.getSetting("platform_name", APP_CONFIG.name);

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">About Us</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <h2>Our Mission</h2>
          <p>
            At {siteName}, our mission is to democratize education and professional development by providing high-quality, AI-driven learning experiences and career optimization tools.
          </p>

          <h2>Who We Are</h2>
          <p>
            We are a team of educators, technologists, and industry professionals dedicated to helping individuals upskill and achieve their career goals.
          </p>

          <h2>What We Do</h2>
          <p>
            We offer a comprehensive platform featuring AI Skill Certificates, Virtual Internships, an ATS Resume Builder, and a LinkedIn Profile Optimizer. Our tools are designed to provide practical, hands-on experience and actionable insights to enhance your professional profile.
          </p>
        </div>
      </div>
    </div>
  );
}
