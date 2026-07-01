import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, bank_name, account_holder, account_number, ifsc_code, upi_id, bank_verified, bank_verified_at, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

  return NextResponse.json({ bank: profile });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { bank_name, account_holder, account_number, ifsc_code, upi_id, phone } = body;

  if (!account_holder || !account_number || !ifsc_code) {
    return NextResponse.json(
      { error: "Account holder name, account number, and IFSC code are required" },
      { status: 400 }
    );
  }

  // Basic IFSC validation
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc_code).toUpperCase())) {
    return NextResponse.json({ error: "Invalid IFSC code format" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, bank_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

  // Updating bank details resets verification
  const { error } = await (adminDb as any)
    .from("affiliate_profiles")
    .update({
      bank_name: bank_name || null,
      account_holder,
      account_number,
      ifsc_code: String(ifsc_code).toUpperCase(),
      upi_id: upi_id || null,
      phone: phone || null,
      bank_verified: false,
      bank_verified_at: null,
      bank_verified_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to save bank details" }, { status: 500 });

  return NextResponse.json({ ok: true, message: "Bank details saved. Pending admin verification." });
}
