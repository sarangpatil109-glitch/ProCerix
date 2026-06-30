import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAffiliateEmail, AFFILIATE_EMAIL_TEMPLATES, getAffiliateSettings, generateAffiliateCoupon } from "@/lib/affiliate";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { name, college_name, designation, phone, experience } = body;

    if (!name || !phone) return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });

    const adminDb = createAdminClient();

    // Check existing application
    const { data: existing, error: existingErr } = await (adminDb as any)
      .from("affiliate_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingErr) {
      console.error(existingErr);
      return NextResponse.json({ 
        message: existingErr.message,
        code: existingErr.code,
        details: existingErr.details,
        hint: existingErr.hint
      }, { status: 500 });
    }

    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json({ error: "Already approved affiliate" }, { status: 400 });
      }
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Application already pending" }, { status: 400 });
      }
      // Rejected: allow re-apply by updating
      const { error: updateErr } = await (adminDb as any).from("affiliate_applications").update({
        name, college_name, designation, phone, experience,
        status: "pending",
        rejection_reason: null,
        email: user.email,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
      
      if (updateErr) {
        console.error(updateErr);
        return NextResponse.json({ 
          message: updateErr.message,
          code: updateErr.code,
          details: updateErr.details,
          hint: updateErr.hint
        }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await (adminDb as any).from("affiliate_applications").insert({
        user_id: user.id,
        name,
        email: user.email,
        college_name,
        designation,
        phone,
        experience,
        status: "pending",
      });
      
      if (insertErr) {
        console.error(insertErr);
        return NextResponse.json({ 
          message: insertErr.message,
          code: insertErr.code,
          details: insertErr.details,
          hint: insertErr.hint
        }, { status: 500 });
      }
    }

    // Check auto-approve
    const settings = await getAffiliateSettings();
    if (settings.auto_approve) {
      // Auto-approve: create profile immediately
      let coupon = generateAffiliateCoupon(name);
      // Ensure unique
      for (let i = 0; i < 5; i++) {
        const { data: exists, error: existErr } = await (adminDb as any).from("affiliate_profiles").select("id").eq("coupon_code", coupon).maybeSingle();
        if (existErr) {
          console.error(existErr);
          return NextResponse.json({ message: existErr.message, code: existErr.code, details: existErr.details, hint: existErr.hint }, { status: 500 });
        }
        if (!exists) break;
        coupon = generateAffiliateCoupon(name);
      }

      const { error: approveErr } = await (adminDb as any).from("affiliate_applications").update({ status: "approved", updated_at: new Date().toISOString() }).eq("user_id", user.id);
      if (approveErr) {
        console.error(approveErr);
        return NextResponse.json({ message: approveErr.message, code: approveErr.code, details: approveErr.details, hint: approveErr.hint }, { status: 500 });
      }
      
      const { data: app, error: appErr } = await (adminDb as any).from("affiliate_applications").select("id").eq("user_id", user.id).maybeSingle();
      if (appErr) {
        console.error(appErr);
        return NextResponse.json({ message: appErr.message, code: appErr.code, details: appErr.details, hint: appErr.hint }, { status: 500 });
      }

      const { error: profErr } = await (adminDb as any).from("affiliate_profiles").insert({
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
      if (profErr) {
        console.error(profErr);
        return NextResponse.json({ message: profErr.message, code: profErr.code, details: profErr.details, hint: profErr.hint }, { status: 500 });
      }

      sendAffiliateEmail(user.email!, "🎉 Welcome to ProCerix Affiliate Program!", AFFILIATE_EMAIL_TEMPLATES.applicationApproved(name, coupon, settings.default_commission_percentage)).catch(() => {});
      return NextResponse.json({ ok: true, status: "approved", coupon });
    }

    sendAffiliateEmail(user.email!, "Affiliate Application Received", AFFILIATE_EMAIL_TEMPLATES.applicationSubmitted(name)).catch(() => {});
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ 
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminDb = createAdminClient();
    const { data: application, error: appErr } = await (adminDb as any)
      .from("affiliate_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (appErr) {
      console.error(appErr);
      return NextResponse.json({ message: appErr.message, code: appErr.code, details: appErr.details, hint: appErr.hint }, { status: 500 });
    }

    const { data: profile, error: profErr } = await (adminDb as any)
      .from("affiliate_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profErr) {
      console.error(profErr);
      return NextResponse.json({ message: profErr.message, code: profErr.code, details: profErr.details, hint: profErr.hint }, { status: 500 });
    }

    return NextResponse.json({ application, profile });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ 
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack
    }, { status: 500 });
  }
}
