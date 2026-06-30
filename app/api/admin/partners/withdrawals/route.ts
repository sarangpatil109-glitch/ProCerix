import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPartnerEmail, PARTNER_EMAIL_TEMPLATES } from "@/lib/partner";

async function assertAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const adminDb = createAdminClient();

  // Query both tables and merge
  let q1 = (adminDb as any).from("withdraw_requests").select("*, partners(full_name, email, referral_code)").order("created_at", { ascending: false });
  let q2 = (adminDb as any).from("partner_withdrawals").select("*, partners(full_name, email, referral_code)").order("created_at", { ascending: false });

  if (status) { q1 = q1.eq("status", status); q2 = q2.eq("status", status); }

  const [r1, r2] = await Promise.all([q1, q2]);
  const all = [
    ...(r1.data || []).map((w: any) => ({ ...w, _table: "withdraw_requests" })),
    ...(r2.data || []).map((w: any) => ({ ...w, _table: "partner_withdrawals" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ withdrawals: all });
}

export async function PATCH(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, status, payment_reference, rejection_reason, _table = "withdraw_requests" } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const adminDb = createAdminClient();
  const tableName = _table === "partner_withdrawals" ? "partner_withdrawals" : "withdraw_requests";

  const updatePayload: Record<string, unknown> = { status };
  if (status === "paid") updatePayload.paid_at = new Date().toISOString();
  if (payment_reference) updatePayload.payment_reference = payment_reference;
  if (rejection_reason) updatePayload.rejection_reason = rejection_reason;

  const { data: withdrawal, error } = await (adminDb as any)
    .from(tableName)
    .update(updatePayload)
    .eq("id", id)
    .select("*, partners(full_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const partner = withdrawal.partners;
  if (status === "approved") {
    const tpl = PARTNER_EMAIL_TEMPLATES.withdrawalApproved(partner?.full_name, withdrawal.amount);
    await sendPartnerEmail(partner?.email, tpl.subject, tpl.html);
  }
  if (status === "paid") {
    const tpl = PARTNER_EMAIL_TEMPLATES.withdrawalPaid(partner?.full_name, withdrawal.amount, payment_reference);
    await sendPartnerEmail(partner?.email, tpl.subject, tpl.html);
    // Update referral commissions to paid
    await (adminDb as any).from("referral_commissions").update({ status: "paid" }).eq("partner_id", withdrawal.partner_id).eq("status", "approved").catch(() => {});
    // Update partner_sales to paid
    await (adminDb as any).from("partner_sales").update({ payment_status: "completed" }).eq("partner_id", withdrawal.partner_id).eq("payment_status", "pending").catch(() => {});
  }

  return NextResponse.json({ withdrawal });
}
