import { Metadata } from "next";
import { SettingsService } from "@/services/settings-service";
import { APP_CONFIG } from "@/constants";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  return {
    title: `Terms & Conditions | ${siteName}`,
    description: `Terms and Conditions for using ${siteName}.`
  };
}

export default async function TermsPage() {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  const supportEmail = settings.support_email || "support@procerix.com";

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using {siteName}, you agree to be bound by these Terms and Conditions and our Privacy Policy.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily access the materials (information or software) on {siteName} for personal, non-commercial transitory viewing only.
          </p>

          <h2>3. Disclaimer</h2>
          <p>
            The materials on {siteName} are provided on an 'as is' basis. {siteName} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall {siteName} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on {siteName}.
          </p>
        </div>
      </div>
    </div>
  );
}
