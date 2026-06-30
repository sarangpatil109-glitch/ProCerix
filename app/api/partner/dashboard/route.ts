import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const adminDb = createAdminClient();

  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: "Not an approved partner" }, { status: 403 });

  // Click count
  const { count: clicks } = await (adminDb as any)
    .from("partner_clicks")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", partner.id);

  // Commission totals
  const { data: commissions } = await (adminDb as any)
    .from("referral_commissions")
    .select("commission_amount, status")
    .eq("partner_id", partner.id);

  const pending_commission = (commissions || []).filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
  const approved_commission = (commissions || []).filter((c: any) => c.status === "approved").reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
  const paid_commission = (commissions || []).filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
  const total_earnings = pending_commission + approved_commission + paid_commission;

  // Pending withdrawal amount (approved commissions minus pending withdrawals)
  const { data: withdrawals } = await (adminDb as any)
    .from("partner_withdrawals")
    .select("amount, status")
    .eq("partner_id", partner.id);

  const pending_withdrawal = (withdrawals || []).filter((w: any) => w.status === "pending").reduce((s: number, w: any) => s + Number(w.amount), 0);
  const withdrawable = approved_commission;

  return NextResponse.json({
    partner,
    stats: {
      total_clicks: clicks ?? 0,
      total_purchases: (commissions || []).length,
      pending_commission,
      approved_commission,
      paid_commission,
      total_earnings,
      pending_withdrawal,
      withdrawable_balance: withdrawable,
    },
  });
}
