import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAffiliateWallet } from "@/lib/affiliate";

// Runs every Sunday via external cron (Vercel Cron / cron-job.org).
// Creates affiliate_weekly_payouts records for last week's completed commissions.
// Does NOT transfer money — admin approval required.

function getPreviousWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat

  // How many days to go back to reach last Sunday
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

export async function POST(req: NextRequest) {
  // Secure the cron endpoint
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end, startStr, endStr } = getPreviousWeekRange();
  const adminDb = createAdminClient();

  // Fetch all active affiliates
  const { data: affiliates, error: affErr } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, name, email")
    .eq("status", "active");

  if (affErr || !affiliates) {
    return NextResponse.json({ error: "Failed to fetch affiliates" }, { status: 500 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const affiliate of affiliates) {
    try {
      // Skip if a record already exists for this week
      const { data: existing } = await (adminDb as any)
        .from("affiliate_weekly_payouts")
        .select("id")
        .eq("affiliate_id", affiliate.id)
        .eq("week_start", startStr)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Sum completed commissions for this specific week
      const { data: sales } = await (adminDb as any)
        .from("affiliate_sales")
        .select("commission_amount")
        .eq("affiliate_id", affiliate.id)
        .eq("payment_status", "completed")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const weeklyAmount = (sales ?? []).reduce(
        (s: number, x: any) => s + Number(x.commission_amount),
        0
      );

      if (weeklyAmount <= 0) {
        skipped++;
        continue;
      }

      // Create the weekly payout record (pending admin approval)
      await (adminDb as any).from("affiliate_weekly_payouts").insert({
        affiliate_id: affiliate.id,
        week_start: startStr,
        week_end: endStr,
        amount: weeklyAmount,
        status: "pending",
      });

      // Sync wallet totals
      await syncAffiliateWallet(adminDb, affiliate.id);

      created++;
    } catch (e: any) {
      errors.push(`${affiliate.id}: ${e.message}`);
    }
  }

  console.log(
    `[cron/weekly-payouts] week=${startStr}→${endStr} created=${created} skipped=${skipped} errors=${errors.length}`
  );

  return NextResponse.json({
    ok: true,
    week: { start: startStr, end: endStr },
    created,
    skipped,
    errors,
  });
}
