import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Wallet, TrendingUp, Clock, CheckCircle, Calendar, ArrowRight, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved:   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  paid:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  rejected:   "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getNextWednesday() {
  const now = new Date();
  const day = now.getDay();
  let daysUntilWed = (3 - day + 7) % 7;
  if (daysUntilWed === 0) daysUntilWed = 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilWed);
  return next.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default async function AffiliatePayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/payouts");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, name, bank_verified, account_holder, account_number, ifsc_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/affiliate");

  const [salesRes, payoutsRes, walletRes] = await Promise.all([
    (adminDb as any)
      .from("affiliate_sales")
      .select("commission_amount, created_at")
      .eq("affiliate_id", profile.id)
      .eq("payment_status", "completed"),
    (adminDb as any)
      .from("affiliate_weekly_payouts")
      .select("*")
      .eq("affiliate_id", profile.id)
      .order("week_start", { ascending: false }),
    (adminDb as any)
      .from("affiliate_wallets")
      .select("available_balance, total_earned, total_paid")
      .eq("affiliate_id", profile.id)
      .maybeSingle(),
  ]);

  const allSales: any[] = salesRes.data ?? [];
  const allPayouts: any[] = payoutsRes.data ?? [];

  // Wallet
  const totalEarned = walletRes.data?.total_earned
    ?? allSales.reduce((s: number, x: any) => s + Number(x.commission_amount), 0);
  const totalPaid = walletRes.data?.total_paid
    ?? allPayouts.filter((p: any) => p.status === "paid").reduce((s: number, x: any) => s + Number(x.amount), 0);
  const walletBalance = walletRes.data?.available_balance ?? Math.max(0, totalEarned - totalPaid);

  // This week's earnings
  const { start: weekStart, end: weekEnd } = getThisWeekRange();
  const thisWeekEarned = allSales
    .filter((s: any) => { const d = new Date(s.created_at); return d >= weekStart && d <= weekEnd; })
    .reduce((s: number, x: any) => s + Number(x.commission_amount), 0);

  // Pending review
  const pendingAmount = allPayouts
    .filter((p: any) => ["pending", "processing"].includes(p.status))
    .reduce((s: number, x: any) => s + Number(x.amount), 0);

  // Paid this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = allPayouts
    .filter((p: any) => p.status === "paid" && p.paid_at && new Date(p.paid_at) >= monthStart)
    .reduce((s: number, x: any) => s + Number(x.amount), 0);

  const lastPayout = allPayouts.find((p: any) => p.status === "paid");
  const hasBankDetails = profile.account_number && profile.ifsc_code && profile.account_holder;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Payouts</h2>
        <p className="text-gray-500 mt-1">Your wallet balance and weekly payout history</p>
      </div>

      {/* Bank status alert */}
      {!hasBankDetails ? (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
          <ShieldOff className="w-5 h-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Bank details required</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
              Add your bank account details on your profile to receive payouts.
            </p>
          </div>
          <Link
            href="/affiliate/dashboard/profile"
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400 hover:underline"
          >
            Add Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : !profile.bank_verified ? (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Bank account pending verification</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Our team will verify your bank details. Payouts will be enabled once verified.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-medium">Bank account verified — payouts enabled</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Wallet Balance"
          value={fmt(walletBalance)}
          sub="Total earned minus paid"
          icon={Wallet}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
        />
        <StatCard
          label="Eligible This Week"
          value={fmt(thisWeekEarned)}
          sub="Current week commissions"
          icon={TrendingUp}
          color="bg-green-100 dark:bg-green-900/30 text-green-600"
        />
        <StatCard
          label="Pending Review"
          value={fmt(pendingAmount)}
          sub="Awaiting admin approval"
          icon={Clock}
          color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
        />
        <StatCard
          label="Paid This Month"
          value={fmt(paidThisMonth)}
          sub={`${allPayouts.filter((p: any) => p.status === "paid" && p.paid_at && new Date(p.paid_at) >= monthStart).length} payout${allPayouts.filter((p: any) => p.status === "paid" && p.paid_at && new Date(p.paid_at) >= monthStart).length !== 1 ? "s" : ""}`}
          icon={CheckCircle}
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
        />
        {lastPayout && (
          <StatCard
            label="Last Payout"
            value={fmt(lastPayout.amount)}
            sub={lastPayout.paid_at ? new Date(lastPayout.paid_at).toLocaleDateString("en-IN") : "—"}
            icon={CheckCircle}
            color="bg-teal-100 dark:bg-teal-900/30 text-teal-600"
          />
        )}
        <StatCard
          label="Next Payout Date"
          value={getNextWednesday()}
          sub="Admin reviews every Wednesday"
          icon={Calendar}
          color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
        />
      </div>

      {/* Payout History */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white">Payout History</h3>
          <p className="text-xs text-gray-400 mt-0.5">Each row represents one weekly payout cycle</p>
        </div>

        {allPayouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">No payouts yet</p>
            <p className="text-sm text-gray-400 mt-1">Payouts are generated every Sunday for the previous week</p>
          </div>
        ) : (
          <>
            {/* Table header (desktop) */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_110px_160px_110px] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Week</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Transfer ID</span>
              <span>Paid Date</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {allPayouts.map((p: any) => (
                <div
                  key={p.id}
                  className="px-6 py-4 grid grid-cols-1 sm:grid-cols-[1fr_120px_110px_160px_110px] gap-2 sm:gap-4 items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {new Date(p.week_start).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} –{" "}
                      {new Date(p.week_end).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {p.remarks && p.status === "failed" && (
                      <p className="text-xs text-red-500 mt-0.5 truncate" title={p.remarks}>{p.remarks}</p>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{fmt(p.amount)}</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase w-fit ${STATUS_STYLES[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                  <p className="font-mono text-xs text-gray-500 truncate" title={p.cashfree_transfer_id ?? ""}>
                    {p.cashfree_transfer_id ?? "—"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
