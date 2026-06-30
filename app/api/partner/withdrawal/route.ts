import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any).from("partners").select("id").eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (!partner) return NextResponse.json({ error: "Not an approved partner" }, { status: 403 });

  const { data } = await (adminDb as any).from("partner_withdrawals").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
  return NextResponse.json({ withdrawals: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any).from("partners").select("*").eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (!partner) return NextResponse.json({ error: "Not an approved partner" }, { status: 403 });

  const { data: settings } = await (adminDb as any).from("partner_settings").select("min_withdrawal_amount, default_commission_rate").eq("id", 1).maybeSingle();
  const minAmount = settings?.min_withdrawal_amount ?? 500;

  // Calculate approved (withdrawable) amount
  const { data: commissions } = await (adminDb as any).from("referral_commissions").select("commission_amount").eq("partner_id", partner.id).eq("status", "approved");
  const approved = (commissions || []).reduce((s: number, c: any) => s + Number(c.commission_amount), 0);

  // Deduct already pending withdrawals
  const { data: pendingWithdrawals } = await (adminDb as any).from("partner_withdrawals").select("amount").eq("partner_id", partner.id).in("status", ["pending", "approved"]);
  const alreadyPending = (pendingWithdrawals || []).reduce((s: number, w: any) => s + Number(w.amount), 0);
  const withdrawable = approved - alreadyPending;

  if (withdrawable < minAmount) {
    return NextResponse.json({ error: `Minimum withdrawal is ₹${minAmount}. Your withdrawable balance is ₹${withdrawable.toFixed(2)}.` }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = Math.min(withdrawable, body.amount ? Number(body.amount) : withdrawable);

  const { data: withdrawal, error } = await (adminDb as any).from("partner_withdrawals").insert({
    partner_id: partner.id,
    amount,
    status: "pending",
    upi_id: partner.upi_id,
    bank_name: partner.bank_name,
    bank_account_number: partner.bank_account_number,
    bank_ifsc: partner.bank_ifsc,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ withdrawal }, { status: 201 });
}
