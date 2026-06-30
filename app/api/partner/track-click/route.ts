import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { referral_code, landing_page } = body;
  if (!referral_code) return NextResponse.json({ ok: false });

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id")
    .eq("referral_code", referral_code.toUpperCase())
    .eq("status", "approved")
    .maybeSingle();

  if (!partner) return NextResponse.json({ ok: false });

  await (adminDb as any).from("partner_clicks").insert({
    partner_id: partner.id,
    referral_code: referral_code.toUpperCase(),
    ip_address: req.headers.get("x-forwarded-for") || null,
    user_agent: req.headers.get("user-agent") || null,
    landing_page: landing_page || null,
  });

  // Increment click counter
  await (adminDb as any).rpc("increment_partner_clicks", { pid: partner.id }).catch(() => {});

  return NextResponse.json({ ok: true });
}
