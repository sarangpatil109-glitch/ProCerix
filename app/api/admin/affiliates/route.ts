import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "";
  const adminDb = createAdminClient();

  let query = (adminDb as any).from("affiliate_profiles").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load affiliates" }, { status: 500 });
  return NextResponse.json({ affiliates: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const adminDb = createAdminClient();
  const allowed = ["status", "commission_percentage", "discount_type", "discount_value", "coupon_code"];
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in updates) patch[k] = updates[k];
  }

  const { error } = await (adminDb as any).from("affiliate_profiles").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
