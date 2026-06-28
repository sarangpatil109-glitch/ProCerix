import { Metadata } from "next";
import { SettingsService } from "@/services/settings-service";
import { APP_CONFIG } from "@/constants";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  return {
    title: `Disclaimer | ${siteName}`,
    description: `Legal disclaimer for ${siteName}.`
  };
}

export default async function DisclaimerPage() {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">Disclaimer</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Educational Purposes Only</h2>
          <p>
            All content and certificates provided by {siteName} are for educational and professional development purposes only.
          </p>

          <h2>2. Not Affiliated</h2>
          <p>
            Unless explicitly stated otherwise, {siteName} is an independent educational platform and is <strong>not affiliated with, endorsed by, or connected to any university, government agency, or official certifying body</strong>.
          </p>

          <h2>3. No Guarantee of Employment</h2>
          <p>
            While our courses, internships, and optimization tools are designed to enhance your skills and professional profile, {siteName} makes no guarantees regarding employment, job placement, or specific career outcomes resulting from the use of our services.
          </p>

          <h2>4. AI-Generated Content</h2>
          <p>
            Some of the content, tools, and feedback provided on this platform are generated or assisted by Artificial Intelligence. While we strive for accuracy, users should independently verify critical information.
          </p>
        </div>
      </div>
    </div>
  );
}
