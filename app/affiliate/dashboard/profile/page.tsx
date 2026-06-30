import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { User } from "lucide-react";

export default async function AffiliateProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/profile");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/affiliate");
  const { data: app } = await (adminDb as any).from("affiliate_applications").select("*").eq("user_id", user.id).maybeSingle();

  const rows = [
    { label: "Name", value: profile.name },
    { label: "Email", value: profile.email || user.email || "—" },
    { label: "Coupon Code", value: profile.coupon_code, mono: true },
    { label: "Commission", value: `${profile.commission_percentage}%` },
    { label: "Discount", value: profile.discount_type === "flat" ? `₹${profile.discount_value} flat` : `${profile.discount_value}%` },
    { label: "Status", value: profile.status },
    { label: "Member Since", value: new Date(profile.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
  ];

  if (app) {
    rows.push({ label: "College / Institution", value: app.college_name || "—" });
    rows.push({ label: "Designation", value: app.designation || "—" });
    rows.push({ label: "Phone", value: app.phone || "—" });
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Profile</h2>
        <p className="text-gray-500 mt-1">Your affiliate account details.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{profile.email || user.email}</p>
        <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">
          {profile.status} Affiliate
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white">Account Details</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(r => (
            <div key={r.label} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500">{r.label}</span>
              <span className={`text-sm font-medium text-gray-900 dark:text-white ${r.mono ? "font-mono" : ""}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
