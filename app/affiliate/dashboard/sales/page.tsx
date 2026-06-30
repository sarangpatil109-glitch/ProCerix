import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default async function AffiliateSalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/sales");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/affiliate");

  const { data: sales } = await (adminDb as any)
    .from("affiliate_sales")
    .select("*")
    .eq("affiliate_id", profile.id)
    .order("created_at", { ascending: false });

  const allSales = sales || [];
  const completed = allSales.filter((s: any) => s.payment_status === "completed");
  const totalEarned = completed.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Sales</h2>
        <p className="text-gray-500 mt-1">{allSales.length} total transactions · ₹{totalEarned.toFixed(2)} earned</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sales", value: String(completed.length) },
          { label: "Total Earned", value: `₹${totalEarned.toFixed(2)}` },
          { label: "Avg Commission", value: completed.length ? `₹${(totalEarned / completed.length).toFixed(2)}` : "₹0" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {allSales.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400">
            <p className="text-lg font-semibold">No sales yet</p>
            <p className="text-sm mt-1">Share your coupon to start earning commissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Coupon</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Sale</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {allSales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.product_type || "Certificate"}</td>
                    <td className="px-6 py-4 font-mono text-blue-600">{s.coupon_code}</td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">₹{Number(s.purchase_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">+₹{Number(s.commission_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.payment_status] || statusColors.pending}`}>
                        {s.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
