import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAffiliateEmail, AFFILIATE_EMAIL_TEMPLATES, getAffiliateSettings, generateAffiliateCoupon } from "@/lib/affiliate";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "";
  const adminDb = createAdminClient();

  let query = (adminDb as any).from("affiliate_applications").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  return NextResponse.json({ applications: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, action, rejection_reason, commission_percentage, discount_type, discount_value, coupon_code } = body;

  if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

  const adminDb = createAdminClient();
  const { data: app } = await (adminDb as any).from("affiliate_applications").select("*").eq("id", id).maybeSingle();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  if (action === "approve") {
    // Update application status
    await (adminDb as any).from("affiliate_applications").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", id);

    const settings = await getAffiliateSettings();
    const commRate = commission_percentage ?? settings.default_commission_percentage;
    const discType = discount_type ?? settings.default_discount_type;
    const discVal = discount_value ?? settings.default_discount_value;

    // Generate unique coupon
    let coupon = coupon_code || generateAffiliateCoupon(app.name);
    for (let i = 0; i < 10; i++) {
      const { data: exists } = await (adminDb as any).from("affiliate_profiles").select("id").eq("coupon_code", coupon).maybeSingle();
      if (!exists) break;
      coupon = generateAffiliateCoupon(app.name);
    }

    // Check if profile already exists
    const { data: existProfile } = await (adminDb as any).from("affiliate_profiles").select("id").eq("user_id", app.user_id).maybeSingle();

    if (existProfile) {
      await (adminDb as any).from("affiliate_profiles").update({
        status: "active",
        coupon_code: coupon,
        commission_percentage: commRate,
        discount_type: discType,
        discount_value: discVal,
        updated_at: new Date().toISOString(),
      }).eq("id", existProfile.id);
    } else {
      await (adminDb as any).from("affiliate_profiles").insert({
        user_id: app.user_id,
        application_id: id,
        name: app.name,
        email: app.email,
        coupon_code: coupon,
        commission_percentage: commRate,
        discount_type: discType,
        discount_value: discVal,
        status: "active",
      });
    }

    if (app.email) {
      sendAffiliateEmail(app.email, "🎉 Affiliate Application Approved!", AFFILIATE_EMAIL_TEMPLATES.applicationApproved(app.name, coupon, commRate)).catch(() => {});
    }

    return NextResponse.json({ ok: true, coupon });
  }

  if (action === "reject") {
    await (adminDb as any).from("affiliate_applications").update({
      status: "rejected",
      rejection_reason: rejection_reason || null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    // Deactivate profile if exists
    await (adminDb as any).from("affiliate_profiles").update({ status: "inactive", updated_at: new Date().toISOString() }).eq("user_id", app.user_id);

    if (app.email) {
      sendAffiliateEmail(app.email, "Affiliate Application Update", AFFILIATE_EMAIL_TEMPLATES.applicationRejected(app.name, rejection_reason)).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
