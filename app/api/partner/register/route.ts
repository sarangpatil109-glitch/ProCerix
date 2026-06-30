import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReferralCode } from "@/lib/partner";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { full_name, college_name, designation, email, phone, upi_id, bank_name, bank_account_number, bank_ifsc } = body;

  if (!full_name || !email || !phone) {
    return NextResponse.json({ error: "full_name, email and phone are required" }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Check if already registered
  const { data: existing } = await (adminDb as any).from("partners").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "Already registered as a partner" }, { status: 409 });

  // Generate unique referral code
  let referral_code = generateReferralCode(full_name, college_name);
  let attempt = 0;
  while (attempt < 5) {
    const { data: clash } = await (adminDb as any).from("partners").select("id").eq("referral_code", referral_code).maybeSingle();
    if (!clash) break;
    referral_code = generateReferralCode(full_name, college_name);
    attempt++;
  }

  // Get default commission rate
  const { data: settings } = await (adminDb as any).from("partner_settings").select("default_commission_rate, auto_approval").eq("id", 1).maybeSingle();
  const commission_rate = settings?.default_commission_rate ?? 50;
  const status = settings?.auto_approval ? "approved" : "pending";

  const { data: partner, error } = await (adminDb as any).from("partners").insert({
    user_id: user.id,
    full_name,
    college_name: college_name || null,
    designation: designation || null,
    email,
    phone,
    upi_id: upi_id || null,
    bank_name: bank_name || null,
    bank_account_number: bank_account_number || null,
    bank_ifsc: bank_ifsc || null,
    referral_code,
    status,
    commission_rate,
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ partner, referral_code }, { status: 201 });
}
