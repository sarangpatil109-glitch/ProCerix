import { Metadata } from "next";
import { SettingsService } from "@/services/settings-service";
import { APP_CONFIG } from "@/constants";
import { Mail, MapPin, Send } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await SettingsService.getSetting("platform_name", APP_CONFIG.name);
  return {
    title: `Contact Us | ${siteName}`,
    description: `Contact ${siteName} for any support or inquiries.`
  };
}

export default async function ContactPage() {
  const siteName = await SettingsService.getSetting("platform_name", APP_CONFIG.name);
  const supportEmail = await SettingsService.getSetting("support_email", "support@procerix.com");

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">Get in Touch</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">We're here to help you with any questions about {siteName}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-blue-600">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Email Us</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">We'll respond within 24 hours.</p>
                  <a href={`mailto:${supportEmail}`} className="text-blue-600 font-medium mt-1 inline-block">{supportEmail}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-blue-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Headquarters</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">123 Tech Park, Innovation Drive<br/>Bangalore, KA 560001<br/>India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send a Message</h3>
          <form action={async (formData) => {
            "use server";
            // Mock contact form submission
          }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">First Name</label>
                <input type="text" name="first_name" required className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Last Name</label>
                <input type="text" name="last_name" required className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Email Address</label>
              <input type="email" name="email" required className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Message</label>
              <textarea name="message" rows={5} required placeholder="How can we help you?" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>

            <button type="submit" className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
              <Send className="w-5 h-5" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
