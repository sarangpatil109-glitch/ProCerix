import { Metadata } from "next";
import { SettingsService } from "@/services/settings-service";
import { APP_CONFIG } from "@/constants";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  return {
    title: `Refund Policy | ${siteName}`,
    description: `Refund Policy for ${siteName}.`
  };
}

export default async function RefundPage() {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  const supportEmail = settings.support_email || "support@procerix.com";

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">Refund Policy</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Refund Eligibility</h2>
          <p>
            At {siteName}, we want you to be fully satisfied with your purchase. As our products (Certificates, Resume Builder, LinkedIn Optimizer, and Virtual Internships) are digital in nature and many involve AI generation costs, our refund policy is designed to be fair.
          </p>

          <h2>2. Certificate & Virtual Internship Courses</h2>
          <p>
            Refunds for courses can be requested within 7 days of purchase, provided that you have not completed more than 20% of the course material and have not generated your final certificate. Once a certificate is issued, no refunds will be granted.
          </p>

          <h2>3. AI Optimization Tools</h2>
          <p>
            Purchases for the ATS Resume Builder and LinkedIn Profile Optimizer are final and non-refundable due to the immediate delivery of digital value and associated AI generation costs.
          </p>

          <h2>4. Requesting a Refund</h2>
          <p>
            To request a refund, please contact us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with your order number and reason for the request.
          </p>
        </div>
      </div>
    </div>
  );
}
