import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Camera } from "lucide-react";
import { ProfileSaveButton } from "@/components/dashboard/ProfileSaveButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Public Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Manage your personal information and how you appear to others.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
        
        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-100 dark:border-gray-800">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border-4 border-white dark:border-gray-900 shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{profile?.first_name} {profile?.last_name}</h3>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <form action={async (formData) => {
          "use server";
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from("profiles").update({
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            bio: formData.get("bio")
            // We can add country and city to db in the future, for now it's in the form
          } as any).eq("id", user!.id);
        }} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200">First Name</label>
              <input type="text" name="first_name" defaultValue={profile?.first_name || ""} className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Last Name</label>
              <input type="text" name="last_name" defaultValue={profile?.last_name || ""} className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Mobile Number</label>
            <input type="text" name="mobile" placeholder="+91" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Country</label>
              <input type="text" name="country" placeholder="e.g. India" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200">City</label>
              <input type="text" name="city" placeholder="e.g. Mumbai" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Bio</label>
            <textarea name="bio" rows={4} defaultValue={profile?.bio || ""} placeholder="Tell us a little about yourself" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <ProfileSaveButton />
          </div>
        </form>
      </div>
    </div>
  );
}
