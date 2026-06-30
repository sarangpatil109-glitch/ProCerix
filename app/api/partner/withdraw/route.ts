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

  const { data } = await (adminDb as any).from("withdraw_requests").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
  return NextResponse.json({ withdrawals: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any).from("partners").select("*").eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (!partner) return NextResponse.json({ error: "Not an approved partner" }, { status: 403 });

  const { data: settings } = await (adminDb as any).from("partner_settings").select("min_withdrawal_amount").eq("id", 1).maybeSingle();
  const minAmount = settings?.min_withdrawal_amount ?? 500;

  // Withdrawable = completed partner_sales commissions not yet withdrawn
  const { data: sales } = await (adminDb as any).from("partner_sales").select("commission_amount").eq("partner_id", partner.id).eq("payment_status", "completed");
  const totalEarned = (sales || []).reduce((s: number, r: any) => s + Number(r.commission_amount), 0);

  const { data: pendingWds } = await (adminDb as any).from("withdraw_requests").select("amount").eq("partner_id", partner.id).in("status", ["pending", "approved"]);
  const pendingTotal = (pendingWds || []).reduce((s: number, w: any) => s + Number(w.amount), 0);

  const { data: paidWds } = await (adminDb as any).from("withdraw_requests").select("amount").eq("partner_id", partner.id).eq("status", "paid");
  const paidTotal = (paidWds || []).reduce((s: number, w: any) => s + Number(w.amount), 0);

  const withdrawable = totalEarned - pendingTotal - paidTotal;

  if (withdrawable < minAmount) {
    return NextResponse.json({ error: `Minimum withdrawal is ₹${minAmount}. Your withdrawable balance is ₹${withdrawable.toFixed(2)}.` }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = body.amount ? Math.min(Number(body.amount), withdrawable) : withdrawable;

  const { data: withdrawal, error } = await (adminDb as any).from("withdraw_requests").insert({
    partner_id: partner.id,
    amount: parseFloat(amount.toFixed(2)),
    status: "pending",
    upi_id: partner.upi_id,
    bank_name: partner.bank_name,
    bank_account_number: partner.bank_account_number,
    bank_ifsc: partner.bank_ifsc,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ withdrawal }, { status: 201 });
}
