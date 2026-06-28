import { Metadata } from "next";
import { SettingsService } from "@/services/settings-service";
import { APP_CONFIG } from "@/constants";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  return {
    title: `Privacy Policy | ${siteName}`,
    description: `Privacy Policy for ${siteName}. Learn how we handle your data.`
  };
}

export default async function PrivacyPolicyPage() {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  const supportEmail = settings.support_email || "support@procerix.com";

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Information We Collect</h2>
          <p>
            Welcome to {siteName}. We collect information you provide directly to us when you register for an account, make a purchase, or communicate with us.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, process transactions, and send you related information including confirmations and receipts.
          </p>

          <h2>3. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to maintain the safety of your personal information when you enter, submit, or access your personal information.
          </p>

          <h2>4. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
