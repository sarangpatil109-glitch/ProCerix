import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminDb = createAdminClient();
  const { data } = await (adminDb as any).from("affiliate_settings").select("*").eq("id", 1).maybeSingle();
  return NextResponse.json({ settings: data ?? {} });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const adminDb = createAdminClient();
  const { error } = await (adminDb as any).from("affiliate_settings").upsert({ id: 1, ...body, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
