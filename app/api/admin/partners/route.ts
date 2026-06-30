import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReferralCode, sendPartnerEmail, PARTNER_EMAIL_TEMPLATES } from "@/lib/partner";

async function assertAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");
  const adminDb = createAdminClient();

  let query = (adminDb as any).from("partners").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%,college_name.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partners: data || [] });
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const {
    full_name, college_name, designation, email, phone,
    upi_id, bank_name, bank_account_number, bank_ifsc,
    referral_code: customCode,
    commission_percentage, commission_rate,
    discount_type = "percentage", discount_value = 10,
    status = "approved",
  } = body;

  if (!full_name || !email || !phone) {
    return NextResponse.json({ error: "full_name, email and phone are required" }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Generate or validate unique code
  let code = (customCode || generateReferralCode(full_name, college_name)).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) code = generateReferralCode(full_name, college_name);
  const { data: existing } = await (adminDb as any).from("partners").select("id").eq("referral_code", code).maybeSingle();
  if (existing) return NextResponse.json({ error: `Coupon code ${code} already exists` }, { status: 409 });

  const commRate = commission_percentage ?? commission_rate ?? 50;

  const { data: settings } = await (adminDb as any).from("partner_settings").select("default_commission_rate").eq("id", 1).maybeSingle();

  const { data: partner, error } = await (adminDb as any).from("partners").insert({
    full_name,
    college_name: college_name || null,
    designation: designation || null,
    email,
    phone,
    upi_id: upi_id || null,
    bank_name: bank_name || null,
    bank_account_number: bank_account_number || null,
    bank_ifsc: bank_ifsc || null,
    referral_code: code,
    status,
    commission_rate: commRate,
    commission_percentage: commRate,
    discount_type,
    discount_value,
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Email or code already registered" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === "approved") {
    const tpl = PARTNER_EMAIL_TEMPLATES.approved(partner.full_name, partner.referral_code);
    await sendPartnerEmail(partner.email, tpl.subject, tpl.html);
  }

  return NextResponse.json({ partner }, { status: 201 });
}
