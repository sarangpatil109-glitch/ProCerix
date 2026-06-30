import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAffiliateEmail, AFFILIATE_EMAIL_TEMPLATES } from "@/lib/affiliate";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "";
  const adminDb = createAdminClient();

  let query = (adminDb as any)
    .from("affiliate_withdraw_requests")
    .select("*, affiliate_profiles(name, email, coupon_code)")
    .order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load withdrawals" }, { status: 500 });
  return NextResponse.json({ withdrawals: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, status, payment_reference, notes } = body;
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

  const adminDb = createAdminClient();
  const { error } = await (adminDb as any).from("affiliate_withdraw_requests").update({
    status,
    payment_reference: payment_reference || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  // Send email on approved
  if (status === "approved" || status === "paid") {
    const { data: wd } = await (adminDb as any).from("affiliate_withdraw_requests").select("amount, affiliate_profiles(name, email)").eq("id", id).maybeSingle();
    if (wd?.affiliate_profiles?.email) {
      sendAffiliateEmail(
        wd.affiliate_profiles.email,
        "Withdrawal Update",
        AFFILIATE_EMAIL_TEMPLATES.withdrawalApproved(wd.affiliate_profiles.name, wd.amount)
      ).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
