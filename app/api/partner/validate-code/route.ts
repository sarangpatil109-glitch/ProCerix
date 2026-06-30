import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ valid: false, error: "No code provided" });

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id, full_name, commission_rate, status")
    .eq("referral_code", code.toUpperCase())
    .maybeSingle();

  if (!partner || partner.status !== "approved") {
    return NextResponse.json({ valid: false, error: "Invalid or inactive referral code" });
  }

  return NextResponse.json({ valid: true, partner_id: partner.id, partner_name: partner.full_name });
}
