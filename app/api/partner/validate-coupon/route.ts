import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcDiscount } from "@/lib/partner";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const rawAmount = req.nextUrl.searchParams.get("amount");

  if (!code) return NextResponse.json({ valid: false, error: "No code provided" });

  const amount = rawAmount ? parseFloat(rawAmount) : 0;

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id, full_name, status, referral_code, discount_type, discount_value, commission_percentage")
    .eq("referral_code", code.toUpperCase())
    .maybeSingle();

  if (!partner || partner.status !== "approved") {
    return NextResponse.json({ valid: false, error: "Invalid or inactive coupon code" });
  }

  const discountType = partner.discount_type || "percentage";
  const discountValue = Number(partner.discount_value ?? 10);
  const { discountAmount, finalAmount } = calcDiscount(amount, discountType, discountValue);

  return NextResponse.json({
    valid: true,
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
