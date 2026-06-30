import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const adminDb = createAdminClient();

  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: "Not an approved partner" }, { status: 403 });

  const { data, error } = await (adminDb as any)
    .from("referral_commissions")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commissions: data || [] });
}
