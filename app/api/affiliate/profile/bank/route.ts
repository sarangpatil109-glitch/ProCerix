import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function maskAccountNumber(raw: string): string {
  if (raw.length <= 4) return raw;
  return "X".repeat(raw.length - 4) + raw.slice(-4);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile, error } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, account_holder, bank_name, account_number, ifsc_code, branch_name, upi_id, phone, bank_verified, bank_verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

  return NextResponse.json({
    bank: {
      account_holder:        profile.account_holder  ?? null,
      bank_name:             profile.bank_name       ?? null,
      account_number_masked: profile.account_number  ? maskAccountNumber(profile.account_number) : null,
      ifsc_code:             profile.ifsc_code       ?? null,
      branch_name:           profile.branch_name     ?? null,
      upi_id:                profile.upi_id          ?? null,
      phone:                 profile.phone           ?? null,
      bank_verified:         profile.bank_verified   ?? false,
      bank_verified_at:      profile.bank_verified_at ?? null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    account_holder,
    bank_name,
    account_number,
    confirm_account_number,
    ifsc_code,
    branch_name,
    upi_id,
    phone,
  } = body;

  if (!account_holder?.trim() || !account_number?.trim() || !ifsc_code?.trim()) {
    return NextResponse.json(
      { error: "Account holder name, account number, and IFSC code are required" },
      { status: 400 },
    );
  }

  if (account_number !== confirm_account_number) {
    return NextResponse.json({ error: "Account numbers do not match" }, { status: 400 });
  }

  const ifscUpper = String(ifsc_code).toUpperCase().trim();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper)) {
    return NextResponse.json(
      { error: "Invalid IFSC code — expected format like SBIN0001234" },
      { status: 400 },
    );
  }

  const adminDb = createAdminClient();
  const { data: existing, error: lookupErr } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupErr || !existing) return NextResponse.json({ error: "Not an affiliate" }, { status: 403 });

  const { error: updateErr } = await (adminDb as any)
    .from("affiliate_profiles")
    .update({
      account_holder:   account_holder.trim(),
      bank_name:        bank_name?.trim()    || null,
      account_number:   account_number.trim(),
      ifsc_code:        ifscUpper,
      branch_name:      branch_name?.trim()  || null,
      upi_id:           upi_id?.trim()       || null,
      phone:            phone?.trim()        || null,
      bank_verified:    false,
      bank_verified_at: null,
      bank_verified_by: null,
      updated_at:       new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateErr) {
    console.error("[bank] PATCH failed:", updateErr);
    return NextResponse.json({ error: "Failed to save bank details" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Bank details saved. Pending admin verification before payouts can be processed.",
  });
}
