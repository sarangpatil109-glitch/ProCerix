import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code, event } = body;
  if (!code || !event) return NextResponse.json({ ok: false });

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id")
    .eq("referral_code", code.toUpperCase())
    .eq("status", "approved")
    .maybeSingle();

  if (!partner) return NextResponse.json({ ok: false });

  // Reuse partner_clicks table — store event type in landing_page field with "event:" prefix
  await (adminDb as any).from("partner_clicks").insert({
    partner_id: partner.id,
    referral_code: code.toUpperCase(),
    landing_page: `event:${event}`,
    ip_address: req.headers.get("x-forwarded-for") || null,
    user_agent: req.headers.get("user-agent") || null,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
