import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrendingUp, MousePointer, ShoppingBag, Wallet, DollarSign, Clock, CheckCircle, Banknote, QrCode, Copy } from "lucide-react";
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

function PeriodCard({ label, sales, commissions }: { label: string; sales: number; commissions: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{commissions.toFixed(0)}</p>
      <p className="text-xs text-gray-500 mt-1">{sales} sale{sales !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any).from("partners").select("*").eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (!partner) redirect("/partner/register");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";
  const referralUrl = `${baseUrl}/?ref=${partner.referral_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(referralUrl)}&size=300x300&margin=10`;

  // Clicks
  const { count: clicks } = await (adminDb as any).from("partner_clicks").select("id", { count: "exact", head: true }).eq("partner_id", partner.id);

  // All partner_sales (new coupon-based)
  const { data: sales } = await (adminDb as any).from("partner_sales").select("commission_amount, purchase_amount, discount_amount, payment_status, created_at").eq("partner_id", partner.id);

  // Fallback: referral_commissions (old URL-based)
  const { data: oldComm } = await (adminDb as any).from("referral_commissions").select("commission_amount, status, created_at, skill_name, course_slug").eq("partner_id", partner.id);

  const allSales = (sales || []);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filterSales = (from: Date) => allSales.filter((s: any) => s.payment_status === "completed" && new Date(s.created_at) >= from);

  const todaySales = filterSales(startOfDay);
  const weekSales = filterSales(startOfWeek);
  const monthSales = filterSales(startOfMonth);
  const lifetimeSales = allSales.filter((s: any) => s.payment_status === "completed");

  const sumComm = (arr: any[]) => arr.reduce((s: number, x: any) => s + Number(x.commission_amount), 0);

  // Withdrawable balance
  const totalEarned = sumComm(lifetimeSales);
  const { data: pendingWds } = await (adminDb as any).from("withdraw_requests").select("amount").eq("partner_id", partner.id).in("status", ["pending", "approved"]);
  const pendingWdAmt = (pendingWds || []).reduce((s: number, w: any) => s + Number(w.amount), 0);
  const { data: paidWds } = await (adminDb as any).from("withdraw_requests").select("amount").eq("partner_id", partner.id).eq("status", "paid");
  const paidWdAmt = (paidWds || []).reduce((s: number, w: any) => s + Number(w.amount), 0);
  const withdrawable = Math.max(0, totalEarned - pendingWdAmt - paidWdAmt);

  // Pending (in-progress sales)
  const pendingEarned = allSales.filter((s: any) => s.payment_status === "pending").reduce((s: number, x: any) => s + Number(x.commission_amount), 0);

  // Recent 5 (from both tables)
  const { data: recentSales } = await (adminDb as any).from("partner_sales").select("*, payments(skill_name)").eq("partner_id", partner.id).order("created_at", { ascending: false }).limit(5);
  const recentOld = (oldComm || []).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome, {partner.full_name.split(" ")[0]}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Coupon: <span className="font-bold text-blue-600 font-mono">{partner.referral_code}</span>
            {" · "}{partner.discount_type === "flat" ? `₹${partner.discount_value} flat discount` : `${partner.discount_value}% discount`}
            {" · "}Commission: <span className="font-bold">{partner.commission_percentage ?? partner.commission_rate}%</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/partner/dashboard/withdrawals" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all">
            <DollarSign className="w-4 h-4" /> Withdraw
          </Link>
          <Link href="/partner/dashboard/purchases" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ShoppingBag className="w-4 h-4" /> Purchases
          </Link>
        </div>
      </div>

      {/* Period stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <PeriodCard label="Today" sales={todaySales.length} commissions={sumComm(todaySales)} />
        <PeriodCard label="This Week" sales={weekSales.length} commissions={sumComm(weekSales)} />
        <PeriodCard label="This Month" sales={monthSales.length} commissions={sumComm(monthSales)} />
        <PeriodCard label="Lifetime" sales={lifetimeSales.length} commissions={sumComm(lifetimeSales)} />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clicks" value={String(clicks ?? 0)} icon={MousePointer} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard label="Total Sales" value={String(lifetimeSales.length)} icon={ShoppingBag} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <StatCard label="Total Earned" value={`₹${totalEarned.toFixed(2)}`} icon={TrendingUp} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <StatCard label="Withdrawable" value={`₹${withdrawable.toFixed(2)}`} icon={Wallet} color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" sub="After pending withdrawals" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Pending Earnings" value={`₹${pendingEarned.toFixed(2)}`} icon={Clock} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" sub="Awaiting payment confirmation" />
        <StatCard label="Pending Withdrawal" value={`₹${pendingWdAmt.toFixed(2)}`} icon={Banknote} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" sub="In review / processing" />
      </div>

      {/* QR Code + Referral Link */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><QrCode className="w-5 h-5" /> Your Referral QR Code</h3>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="text-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt={`QR for ${partner.referral_code}`} width={160} height={160} className="rounded-xl border border-gray-200 dark:border-gray-800 mx-auto" />
            <a href={qrUrl} download={`${partner.referral_code}-qr.png`} className="mt-3 inline-block text-xs text-blue-600 hover:underline font-medium">Download QR</a>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">COUPON CODE</p>
              <p className="font-mono font-bold text-2xl text-blue-600">{partner.referral_code}</p>
              <p className="text-xs text-gray-500 mt-1">Students enter this at checkout for {partner.discount_type === "flat" ? `₹${partner.discount_value}` : `${partner.discount_value}%`} discount</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">REFERRAL LINK</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-mono flex-1 truncate">{referralUrl}</p>
                <form action={`javascript:navigator.clipboard.writeText('${referralUrl}')`}>
                  <button type="submit" className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"><Copy className="w-4 h-4" /></button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      {recentSales && recentSales.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Sales</h3>
            <Link href="/partner/dashboard/purchases" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentSales.map((s: any) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{s.product_type || "Certificate"}</p>
                  <p className="text-xs text-gray-500">Coupon: {s.coupon_code} · {new Date(s.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₹{Number(s.commission_amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Sale: ₹{Number(s.purchase_amount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: old referral commissions if no new sales */}
      {(!recentSales || recentSales.length === 0) && recentOld.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Commissions</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOld.map((c: any) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{c.skill_name || c.course_slug || "Course"}</p>
                  <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₹{Number(c.commission_amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    c.status === "approved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
