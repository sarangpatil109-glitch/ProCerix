import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAffiliateSettings } from "@/lib/affiliate";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

  const { data: withdrawals } = await (adminDb as any)
    .from("affiliate_withdraw_requests")
    .select("*")
    .eq("affiliate_id", profile.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ withdrawals: withdrawals || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { amount, upi_id } = body;

  if (!amount || !upi_id) return NextResponse.json({ error: "Amount and UPI ID required" }, { status: 400 });

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

  const settings = await getAffiliateSettings();
  if (Number(amount) < settings.minimum_withdrawal) {
    return NextResponse.json({ error: `Minimum withdrawal is ₹${settings.minimum_withdrawal}` }, { status: 400 });
  }

  // Calculate available balance
  const { data: sales } = await (adminDb as any).from("affiliate_sales").select("commission_amount").eq("affiliate_id", profile.id).eq("payment_status", "completed");
  const { data: wds } = await (adminDb as any).from("affiliate_withdraw_requests").select("amount, status").eq("affiliate_id", profile.id).in("status", ["pending", "approved", "paid"]);

  const totalEarned = (sales || []).reduce((s: number, x: any) => s + Number(x.commission_amount), 0);
  const totalUsed = (wds || []).reduce((s: number, w: any) => s + Number(w.amount), 0);
  const available = Math.max(0, totalEarned - totalUsed);

  if (Number(amount) > available) {
    return NextResponse.json({ error: `Insufficient balance. Available: ₹${available.toFixed(2)}` }, { status: 400 });
  }

  const { error } = await (adminDb as any).from("affiliate_withdraw_requests").insert({
    affiliate_id: profile.id,
    amount: Number(amount),
    upi_id,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
