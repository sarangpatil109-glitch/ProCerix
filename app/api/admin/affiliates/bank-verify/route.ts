import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

/**
 * PATCH /api/admin/affiliates/bank-verify
 * Body: { affiliate_id: string, verified: boolean }
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { affiliate_id, verified } = body;

  if (!affiliate_id) return NextResponse.json({ error: "affiliate_id is required" }, { status: 400 });

  const adminDb = createAdminClient();

  const { error } = await (adminDb as any)
    .from("affiliate_profiles")
    .update({
      bank_verified: !!verified,
      bank_verified_at: verified ? new Date().toISOString() : null,
      bank_verified_by: verified ? user.email : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliate_id);

  if (error) return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });

  return NextResponse.json({ ok: true, verified: !!verified });
}
