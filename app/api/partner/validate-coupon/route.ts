import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcDiscount } from "@/lib/partner";
import { calcAffiliateDiscount } from "@/lib/affiliate";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const rawAmount = req.nextUrl.searchParams.get("amount");

  if (!code) return NextResponse.json({ valid: false, error: "No code provided" });

  const amount = rawAmount ? parseFloat(rawAmount) : 0;
  const adminDb = createAdminClient();

  // 1. Check partners table first
  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id, full_name, status, referral_code, discount_type, discount_value, commission_percentage")
    .eq("referral_code", code.toUpperCase())
    .maybeSingle();

  if (partner && partner.status === "approved") {
    const discountType = partner.discount_type || "percentage";
    const discountValue = Number(partner.discount_value ?? 10);
    const { discountAmount, finalAmount } = calcDiscount(amount, discountType, discountValue);
    return NextResponse.json({
      valid: true,
      source: "partner",
      partner_id: partner.id,
      partner_name: partner.full_name,
      coupon_code: partner.referral_code,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: amount > 0 ? discountAmount : null,
      final_amount: amount > 0 ? finalAmount : null,
      commission_percentage: partner.commission_percentage,
    });
  }

  // 2. Check affiliate_profiles table
  const { data: affiliate } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, name, status, coupon_code, discount_type, discount_value, commission_percentage")
    .eq("coupon_code", code.toUpperCase())
    .maybeSingle();

  if (affiliate && affiliate.status === "active") {
    const discountType = affiliate.discount_type || "percentage";
    const discountValue = Number(affiliate.discount_value ?? 10);
    const { discountAmount, finalAmount } = calcAffiliateDiscount(amount, discountType, discountValue);
    return NextResponse.json({
      valid: true,
      source: "affiliate",
      affiliate_id: affiliate.id,
      partner_name: affiliate.name,
      coupon_code: affiliate.coupon_code,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: amount > 0 ? discountAmount : null,
      final_amount: amount > 0 ? finalAmount : null,
      commission_percentage: affiliate.commission_percentage,
    });
  }

  return NextResponse.json({ valid: false, error: "Invalid or inactive coupon code" });
}
