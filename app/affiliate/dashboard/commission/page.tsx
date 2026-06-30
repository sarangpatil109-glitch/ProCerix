import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrendingUp } from "lucide-react";

export default async function AffiliateCommissionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/commission");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/affiliate");

  const { data: sales } = await (adminDb as any)
    .from("affiliate_sales")
    .select("commission_amount, purchase_amount, discount_amount, payment_status, created_at")
    .eq("affiliate_id", profile.id)
    .eq("payment_status", "completed")
    .order("created_at", { ascending: false });

  const allSales = sales || [];
  const totalEarned = allSales.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0);
  const totalSaleVolume = allSales.reduce((sum: number, s: any) => sum + Number(s.purchase_amount), 0);
  const totalDiscount = allSales.reduce((sum: number, s: any) => sum + Number(s.discount_amount), 0);
  const avgCommission = allSales.length ? totalEarned / allSales.length : 0;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Commission</h2>
        <p className="text-gray-500 mt-1">Your commission rate: <span className="font-bold text-blue-600">{profile.commission_percentage}%</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Commission", value: `₹${totalEarned.toFixed(2)}`, color: "text-green-600" },
          { label: "Total Sale Volume", value: `₹${totalSaleVolume.toFixed(2)}`, color: "text-blue-600" },
          { label: "Total Discounts Given", value: `₹${totalDiscount.toFixed(2)}`, color: "text-orange-600" },
          { label: "Avg Commission/Sale", value: `₹${avgCommission.toFixed(2)}`, color: "text-purple-600" },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
            <TrendingUp className={`w-6 h-6 ${c.color} mx-auto mb-2`} />
            <p className={`text-xl font-extrabold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Commission Breakdown</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500">Commission Rate</span>
            <span className="font-bold text-gray-900 dark:text-white">{profile.commission_percentage}% of sale amount</span>
          </div>
          <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500">Discount Offered</span>
            <span className="font-bold text-gray-900 dark:text-white">{profile.discount_type === "flat" ? `₹${profile.discount_value} flat` : `${profile.discount_value}%`}</span>
          </div>
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-gray-500">Commission Calculated On</span>
            <span className="font-bold text-gray-900 dark:text-white">Original price (before discount)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
