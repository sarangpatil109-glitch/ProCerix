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

  const partnerId = req.nextUrl.searchParams.get("partner_id");
  const adminDb = createAdminClient();

  let query = (adminDb as any)
    .from("partner_sales")
    .select("*, partners(full_name, email, referral_code)")
    .order("created_at", { ascending: false });

  if (partnerId) query = query.eq("partner_id", partnerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sales: data || [] });
}
