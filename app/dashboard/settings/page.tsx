import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Lock, Palette, Mail, ShieldAlert, LogOut, Activity } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Account & Security
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Manage your account settings, security preferences, and active sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          
          {/* Email Update Section */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Address</h2>
            </div>
            
            <form action={async (formData) => {
              "use server";
              // Mock email update
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Current Email</label>
                <input type="email" readOnly value={user.email} className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">New Email</label>
                <input type="email" name="new_email" placeholder="Enter new email address" required className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
              </div>
              <div className="pt-2">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors w-full">
                  Update Email
                </button>
              </div>
            </form>
          </section>

          {/* Security Section */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
            </div>
            
            <form action={async (formData) => {
              "use server";
              // Mock password update
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Current Password</label>
                <input type="password" name="current_password" required className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">New Password</label>
                <input type="password" name="new_password" required className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none transition-all" />
              </div>
              <div className="pt-2">
                <button type="submit" className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold transition-colors w-full">
                  Update Password
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-8">
          
          {/* Preferences Section */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Theme Preference</h3>
                  <p className="text-sm text-gray-500">Choose between light or dark mode.</p>
                </div>
                <select className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-medium">
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Language</h3>
                  <p className="text-sm text-gray-500">Platform language preference.</p>
                </div>
                <select className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-medium">
                  <option value="en">English (US)</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
          </section>

          {/* Sessions & Security */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Sessions</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Windows PC • Chrome</p>
                  <p className="text-sm text-gray-500">Mumbai, India (Current Session)</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">iPhone 14 Pro • Safari</p>
                  <p className="text-sm text-gray-500">Last active 2 days ago</p>
                </div>
                <button className="text-sm text-red-600 font-bold hover:underline">Revoke</button>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full font-bold transition-colors w-full">
                  <LogOut className="w-4 h-4" /> Logout Current Session
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-full font-bold transition-colors w-full">
                  <ShieldAlert className="w-4 h-4" /> Logout All Devices
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-500 mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors w-full">
              Request Account Deletion
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
