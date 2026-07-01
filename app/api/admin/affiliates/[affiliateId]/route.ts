import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { affiliateId } = await params;
  const adminDb = createAdminClient();

  // Profile
  const { data: profile, error: profileError } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("*")
    .eq("id", affiliateId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  // Wallet
  const { data: wallet } = await (adminDb as any)
    .from("affiliate_wallets")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .maybeSingle();

  // Sales (all, no limit — admin CRM)
  const { data: rawSales } = await (adminDb as any)
    .from("affiliate_sales")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  const sales: any[] = rawSales || [];

  // Enrich sales: join payments → profiles for customer info
  const paymentIds = sales.map((s: any) => s.payment_id).filter(Boolean);
  const paymentsById: Record<string, any> = {};

  if (paymentIds.length > 0) {
    const { data: payments } = await (adminDb as any)
      .from("payments")
      .select("id, course_id, course_slug, skill_name, cashfree_order_id, user_id, status")
      .in("id", paymentIds);

    const userIds = [...new Set((payments || []).map((p: any) => p.user_id).filter(Boolean))] as string[];

    // Customer names from profiles table
    const profilesById: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: userProfiles } = await (adminDb as any)
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      for (const p of (userProfiles || [])) {
        profilesById[p.id] = p;
      }
    }

    // Customer emails from auth.users (service role has access)
    const emailById: Record<string, string> = {};
    if (userIds.length > 0) {
      try {
        const { data: { users: authUsers } } = await adminDb.auth.admin.listUsers({
          perPage: 1000,
        });
        for (const u of authUsers || []) {
          if (userIds.includes(u.id)) emailById[u.id] = u.email ?? "";
        }
      } catch {
        // Non-fatal: email column unavailable
      }
    }

    for (const p of (payments || [])) {
      const up = profilesById[p.user_id] || {};
      paymentsById[p.id] = {
        ...p,
        customer_name: [up.first_name, up.last_name].filter(Boolean).join(" ") || "—",
        customer_email: emailById[p.user_id] || "—",
      };
    }
  }

  const enrichedSales = sales.map((s: any) => ({
    ...s,
    payment: paymentsById[s.payment_id] ?? null,
  }));

  // Weekly payouts
  const { data: weeklyPayouts } = await (adminDb as any)
    .from("affiliate_weekly_payouts")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("week_start", { ascending: false });

  // Withdrawal requests
  const { data: withdrawals } = await (adminDb as any)
    .from("affiliate_withdraw_requests")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    profile,
    wallet: wallet ?? null,
    sales: enrichedSales,
    weeklyPayouts: weeklyPayouts ?? [],
    withdrawals: withdrawals ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { affiliateId } = await params;
  const body = await req.json().catch(() => ({}));
  const adminDb = createAdminClient();

  const allowed = ["status", "commission_percentage", "discount_type", "discount_value", "coupon_code"];
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  const { error } = await (adminDb as any)
    .from("affiliate_profiles")
    .update(patch)
    .eq("id", affiliateId);

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
