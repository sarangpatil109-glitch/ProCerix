import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAffiliateEmail, AFFILIATE_EMAIL_TEMPLATES, getAffiliateSettings, generateAffiliateCoupon } from "@/lib/affiliate";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, college_name, designation, phone, experience } = body;

  if (!name || !phone) return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });

  const adminDb = createAdminClient();

  // Check existing application
  const { data: existing } = await (adminDb as any)
    .from("affiliate_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "approved") {
      return NextResponse.json({ error: "Already approved affiliate" }, { status: 400 });
    }
    if (existing.status === "pending") {
      return NextResponse.json({ error: "Application already pending" }, { status: 400 });
    }
    // Rejected: allow re-apply by updating
    const { error } = await (adminDb as any).from("affiliate_applications").update({
      name, college_name, designation, phone, experience,
      status: "pending",
      rejection_reason: null,
      email: user.email,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  } else {
    const { error } = await (adminDb as any).from("affiliate_applications").insert({
      user_id: user.id,
      name,
      email: user.email,
      college_name,
      designation,
      phone,
      experience,
      status: "pending",
    });
    if (error) return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }

  // Check auto-approve
  const settings = await getAffiliateSettings();
  if (settings.auto_approve) {
    // Auto-approve: create profile immediately
    let coupon = generateAffiliateCoupon(name);
    // Ensure unique
    for (let i = 0; i < 5; i++) {
      const { data: exists } = await (adminDb as any).from("affiliate_profiles").select("id").eq("coupon_code", coupon).maybeSingle();
      if (!exists) break;
      coupon = generateAffiliateCoupon(name);
    }

    await (adminDb as any).from("affiliate_applications").update({ status: "approved", updated_at: new Date().toISOString() }).eq("user_id", user.id);
    const { data: app } = await (adminDb as any).from("affiliate_applications").select("id").eq("user_id", user.id).maybeSingle();
    await (adminDb as any).from("affiliate_profiles").insert({
      user_id: user.id,
      application_id: app?.id,
      name,
      email: user.email,
      coupon_code: coupon,
      commission_percentage: settings.default_commission_percentage,
      discount_type: settings.default_discount_type,
      discount_value: settings.default_discount_value,
      status: "active",
    });
    sendAffiliateEmail(user.email!, "🎉 Welcome to ProCerix Affiliate Program!", AFFILIATE_EMAIL_TEMPLATES.applicationApproved(name, coupon, settings.default_commission_percentage)).catch(() => {});
    return NextResponse.json({ ok: true, status: "approved", coupon });
  }

  sendAffiliateEmail(user.email!, "Affiliate Application Received", AFFILIATE_EMAIL_TEMPLATES.applicationSubmitted(name)).catch(() => {});
  return NextResponse.json({ ok: true, status: "pending" });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: application } = await (adminDb as any)
    .from("affiliate_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ application, profile });
}
