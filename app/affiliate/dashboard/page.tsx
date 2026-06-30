import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrendingUp, MousePointer, ShoppingBag, Wallet, Clock, DollarSign, Banknote } from "lucide-react";
import Link from "next/link";

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PeriodCard({ label, sales, commission }: { label: string; sales: number; commission: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{commission.toFixed(0)}</p>
      <p className="text-xs text-gray-500 mt-1">{sales} sale{sales !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile || profile.status !== "active") redirect("/affiliate");

  const { data: sales } = await (adminDb as any).from("affiliate_sales").select("commission_amount, purchase_amount, payment_status, created_at, coupon_code, product_type").eq("affiliate_id", profile.id);
  const { count: clicks } = await (adminDb as any).from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", profile.id);
  const { data: wds } = await (adminDb as any).from("affiliate_withdraw_requests").select("amount, status").eq("affiliate_id", profile.id);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completed = (sales || []).filter((s: any) => s.payment_status === "completed");
  const sumComm = (arr: any[]) => arr.reduce((s: number, x: any) => s + Number(x.commission_amount), 0);
  const filterSales = (from: Date) => completed.filter((s: any) => new Date(s.created_at) >= from);

  const totalEarned = sumComm(completed);
  const pendingWdAmt = (wds || []).filter((w: any) => ["pending", "approved"].includes(w.status)).reduce((s: number, w: any) => s + Number(w.amount), 0);
  const paidWdAmt = (wds || []).filter((w: any) => w.status === "paid").reduce((s: number, w: any) => s + Number(w.amount), 0);
  const withdrawable = Math.max(0, totalEarned - pendingWdAmt - paidWdAmt);
  const pendingEarned = sumComm((sales || []).filter((s: any) => s.payment_status === "pending"));

  const recentSales = (sales || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome, {profile.name.split(" ")[0]}</h2>
          <p className="text-gray-500 mt-1">
            Coupon: <span className="font-bold text-blue-600 font-mono">{profile.coupon_code}</span>
            {" · "}{profile.discount_type === "flat" ? `₹${profile.discount_value} flat` : `${profile.discount_value}% discount`}
            {" · "}Commission: <span className="font-bold">{profile.commission_percentage}%</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/affiliate/dashboard/withdraw" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all">
            <DollarSign className="w-4 h-4" /> Withdraw
          </Link>
          <Link href="/affiliate/dashboard/promotion" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Promote
          </Link>
        </div>
      </div>

      {/* Period cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <PeriodCard label="Today" sales={filterSales(startOfDay).length} commission={sumComm(filterSales(startOfDay))} />
        <PeriodCard label="This Week" sales={filterSales(startOfWeek).length} commission={sumComm(filterSales(startOfWeek))} />
        <PeriodCard label="This Month" sales={filterSales(startOfMonth).length} commission={sumComm(filterSales(startOfMonth))} />
        <PeriodCard label="Lifetime" sales={completed.length} commission={totalEarned} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clicks" value={String(clicks ?? 0)} icon={MousePointer} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600" />
        <StatCard label="Total Sales" value={String(completed.length)} icon={ShoppingBag} color="bg-green-100 dark:bg-green-900/30 text-green-600" />
        <StatCard label="Total Earned" value={`₹${totalEarned.toFixed(2)}`} icon={TrendingUp} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600" />
        <StatCard label="Withdrawable" value={`₹${withdrawable.toFixed(2)}`} icon={Wallet} color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" sub="After pending withdrawals" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Pending Earnings" value={`₹${pendingEarned.toFixed(2)}`} icon={Clock} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600" sub="Awaiting payment confirmation" />
        <StatCard label="Pending Withdrawal" value={`₹${pendingWdAmt.toFixed(2)}`} icon={Banknote} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" sub="In review / processing" />
      </div>

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Sales</h3>
            <Link href="/affiliate/dashboard/sales" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentSales.map((s: any) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{s.product_type || "Certificate"}</p>
                  <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString("en-IN")} · {s.coupon_code}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₹{Number(s.commission_amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">₹{Number(s.purchase_amount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
