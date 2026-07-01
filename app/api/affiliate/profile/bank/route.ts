import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function maskAccountNumber(raw: string): string {
  if (raw.length <= 4) return raw;
  return "X".repeat(raw.length - 4) + raw.slice(-4);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const adminDb = createAdminClient();
    const { data: profile, error } = await (adminDb as any)
      .from("affiliate_profiles")
      .select("id, account_holder, bank_name, account_number, ifsc_code, branch_name, upi_id, phone, bank_verified, bank_verified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ success: false, message: "Not an affiliate" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
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
  } catch (err: any) {
    console.error("[bank] GET error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch bank details" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

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

    // ── Validation ──────────────────────────────────────────────────────────
    if (!account_holder?.trim()) {
      return NextResponse.json({ success: false, message: "Account holder name is required" }, { status: 400 });
    }
    if (!bank_name?.trim()) {
      return NextResponse.json({ success: false, message: "Bank name is required" }, { status: 400 });
    }
    if (!account_number?.trim()) {
      return NextResponse.json({ success: false, message: "Account number is required" }, { status: 400 });
    }
    if (!confirm_account_number?.trim()) {
      return NextResponse.json({ success: false, message: "Please confirm your account number" }, { status: 400 });
    }
    if (account_number.trim() !== confirm_account_number.trim()) {
      return NextResponse.json({ success: false, message: "Account numbers do not match" }, { status: 400 });
    }
    if (!ifsc_code?.trim()) {
      return NextResponse.json({ success: false, message: "IFSC code is required" }, { status: 400 });
    }

    const ifscUpper = String(ifsc_code).toUpperCase().trim();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper)) {
      return NextResponse.json(
        { success: false, message: "Invalid IFSC code — expected format like SBIN0001234" },
        { status: 400 },
      );
    }

    if (phone?.trim() && !/^\d{10}$/.test(phone.trim())) {
      return NextResponse.json(
        { success: false, message: "Mobile number must be 10 digits" },
        { status: 400 },
      );
    }

    // ── Look up affiliate profile ────────────────────────────────────────────
    const adminDb = createAdminClient();
    const { data: existing, error: lookupErr } = await (adminDb as any)
      .from("affiliate_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupErr) {
      console.error("[bank] PATCH lookup error:", lookupErr);
      return NextResponse.json({ success: false, message: "Failed to verify affiliate status" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ success: false, message: "No affiliate profile found for your account" }, { status: 403 });
    }

    // ── Save bank details ────────────────────────────────────────────────────
    const payload: Record<string, any> = {
      account_holder:   account_holder.trim(),
      bank_name:        bank_name.trim(),
      account_number:   account_number.trim(),
      ifsc_code:        ifscUpper,
      branch_name:      branch_name?.trim()  || null,
      upi_id:           upi_id?.trim()       || null,
      phone:            phone?.trim()        || null,
      bank_verified:    false,
      bank_verified_at: null,
      bank_verified_by: null,
      updated_at:       new Date().toISOString(),
    };

    const { error: updateErr } = await (adminDb as any)
      .from("affiliate_profiles")
      .update(payload)
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("[bank] PATCH update error:", updateErr);
      return NextResponse.json(
        { success: false, message: "Failed to save bank details. Please try again." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bank details saved successfully. Pending admin verification before payouts can be processed.",
    });
  } catch (err: any) {
    console.error("[bank] PATCH unhandled error:", err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
