import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return map[s] || "bg-gray-100 text-gray-700";
};

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any).from("partners").select("id").eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (!partner) redirect("/partner/register");

  const { data: commissions } = await (adminDb as any)
    .from("referral_commissions")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Purchase History</h2>
        <p className="text-gray-500 text-sm mt-1">All commissions earned through your referral code.</p>
      </div>

      {!commissions || commissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-20 text-center">
          <p className="text-gray-500">No purchases yet. Share your referral link to start earning!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course / Skill</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {commissions.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.skill_name || c.course_slug || "—"}</td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">₹{Number(c.purchase_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{c.commission_rate}%</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">₹{Number(c.commission_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
