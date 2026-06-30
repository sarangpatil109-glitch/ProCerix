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

  const affiliateId = req.nextUrl.searchParams.get("affiliate_id") || "";
  const adminDb = createAdminClient();

  let query = (adminDb as any)
    .from("affiliate_sales")
    .select("*, affiliate_profiles(name, email, coupon_code)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (affiliateId) query = query.eq("affiliate_id", affiliateId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load sales" }, { status: 500 });
  return NextResponse.json({ sales: data || [] });
}
