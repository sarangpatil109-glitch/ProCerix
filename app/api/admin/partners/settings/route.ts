import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminDb = createAdminClient();
  const { data } = await (adminDb as any).from("partner_settings").select("*").eq("id", 1).single();
  return NextResponse.json({ settings: data });
}

export async function PUT(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { default_commission_rate, min_withdrawal_amount, auto_approval } = body;

  const adminDb = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (default_commission_rate !== undefined) payload.default_commission_rate = default_commission_rate;
  if (min_withdrawal_amount !== undefined) payload.min_withdrawal_amount = min_withdrawal_amount;
  if (auto_approval !== undefined) payload.auto_approval = auto_approval;

  const { data, error } = await (adminDb as any).from("partner_settings").update(payload).eq("id", 1).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
