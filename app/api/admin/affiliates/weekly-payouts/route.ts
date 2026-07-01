import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAffiliateWallet } from "@/lib/affiliate";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

function getPreviousWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const daysBack = day === 0 ? 7 : day;
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - daysBack);
  lastSunday.setHours(0, 0, 0, 0);
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6);
  lastSaturday.setHours(23, 59, 59, 999);
  return {
    start: lastSunday,
    end: lastSaturday,
    startStr: lastSunday.toISOString().split("T")[0],
    endStr: lastSaturday.toISOString().split("T")[0],
  };
}

/** GET /api/admin/affiliates/weekly-payouts?status=pending&week=2026-06-22 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const week   = req.nextUrl.searchParams.get("week") || "";

  const adminDb = createAdminClient();

  let query = (adminDb as any)
    .from("affiliate_weekly_payouts")
    .select(`
      *,
      affiliate_profiles (
        id, name, email, coupon_code, phone,
        bank_name, account_holder, account_number, ifsc_code, upi_id,
        bank_verified, bank_verified_at
      ),
      affiliate_wallets (
        available_balance, total_earned, total_paid
      )
    `)
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (week) query = query.eq("week_start", week);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 });

  return NextResponse.json({ payouts: data ?? [] });
}

/**
 * POST /api/admin/affiliates/weekly-payouts
 * Manually triggers previous-week payout record generation (same as Sunday cron).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  // Allow admin to specify a custom week range; defaults to previous week
  const { start: startStr, end: endStr, start: startOverride, end: endOverride } = (() => {
    if (body.week_start && body.week_end) {
      return { start: body.week_start, end: body.week_end };
    }
    const r = getPreviousWeekRange();
    return { start: r.startStr, end: r.endStr };
  })();

  const weekStart = new Date(`${startStr}T00:00:00.000Z`);
  const weekEnd   = new Date(`${endStr}T23:59:59.999Z`);

  const adminDb = createAdminClient();
  const { data: affiliates } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, name, email")
    .eq("status", "active");

  let created = 0, skipped = 0;

  for (const affiliate of affiliates ?? []) {
    const { data: existing } = await (adminDb as any)
      .from("affiliate_weekly_payouts")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("week_start", startStr)
      .maybeSingle();

    if (existing) { skipped++; continue; }

    const { data: sales } = await (adminDb as any)
      .from("affiliate_sales")
      .select("commission_amount")
      .eq("affiliate_id", affiliate.id)
      .eq("payment_status", "completed")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    const weeklyAmount = (sales ?? []).reduce(
      (s: number, x: any) => s + Number(x.commission_amount), 0
    );

    if (weeklyAmount <= 0) { skipped++; continue; }

    await (adminDb as any).from("affiliate_weekly_payouts").insert({
      affiliate_id: affiliate.id,
      week_start: startStr,
      week_end: endStr,
      amount: weeklyAmount,
      status: "pending",
    });
    await syncAffiliateWallet(adminDb, affiliate.id);
    created++;
  }

  return NextResponse.json({ ok: true, week: { start: startStr, end: endStr }, created, skipped });
}
