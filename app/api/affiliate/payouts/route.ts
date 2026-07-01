import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getNextWednesday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  // 3 = Wednesday
  let daysUntilWed = (3 - day + 7) % 7;
  if (daysUntilWed === 0) daysUntilWed = 7; // already Wednesday → next one
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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();

  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, name, bank_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

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

  // Wallet balance (use synced snapshot or compute live as fallback)
  const totalEarned = walletRes.data?.total_earned
    ?? allSales.reduce((s: number, x: any) => s + Number(x.commission_amount), 0);
  const totalPaid = walletRes.data?.total_paid
    ?? allPayouts.filter((p: any) => p.status === "paid").reduce((s: number, x: any) => s + Number(x.amount), 0);
  const walletBalance = walletRes.data?.available_balance ?? Math.max(0, totalEarned - totalPaid);

  // This week's earnings
  const { start: weekStart, end: weekEnd } = getThisWeekRange();
  const thisWeekEarned = allSales
    .filter((s: any) => {
      const d = new Date(s.created_at);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((s: number, x: any) => s + Number(x.commission_amount), 0);

  // Pending review (pending + processing)
  const pendingAmount = allPayouts
    .filter((p: any) => ["pending", "processing"].includes(p.status))
    .reduce((s: number, x: any) => s + Number(x.amount), 0);

  // Paid this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = allPayouts
    .filter((p: any) => p.status === "paid" && p.paid_at && new Date(p.paid_at) >= monthStart)
    .reduce((s: number, x: any) => s + Number(x.amount), 0);

  // Last payout
  const lastPayout = allPayouts.find((p: any) => p.status === "paid") ?? null;

  return NextResponse.json({
    wallet: {
      available_balance: walletBalance,
      total_earned: totalEarned,
      total_paid: totalPaid,
    },
    stats: {
      thisWeekEarned,
      pendingAmount,
      paidThisMonth,
      lastPayout,
      nextPayoutDate: getNextWednesday(),
      bankVerified: profile.bank_verified,
    },
    payouts: allPayouts,
  });
}
