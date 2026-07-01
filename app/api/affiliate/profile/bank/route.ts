import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function maskAccountNumber(raw: string): string {
  if (raw.length <= 4) return raw;
  return "X".repeat(raw.length - 4) + raw.slice(-4);
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[bank:GET] Unauthorized – no session");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const { data: profile, error } = await (adminDb as any)
      .from("affiliate_profiles")
      .select("id, account_holder, bank_name, account_number, ifsc_code, branch_name, upi_id, phone, bank_verified, bank_verified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[bank:GET] Supabase error:", error);
      return NextResponse.json({ success: false, message: "Failed to fetch bank details" }, { status: 500 });
    }
    if (!profile) {
      console.log("[bank:GET] No affiliate profile found for user:", user.id);
      return NextResponse.json({ success: false, message: "Not an affiliate" }, { status: 403 });
    }

    console.log("[bank:GET] Returning bank details for affiliate:", profile.id);
    return NextResponse.json({
      success: true,
      bank: {
        account_holder:        profile.account_holder   ?? null,
        bank_name:             profile.bank_name        ?? null,
        account_number_masked: profile.account_number   ? maskAccountNumber(profile.account_number) : null,
        ifsc_code:             profile.ifsc_code        ?? null,
        branch_name:           profile.branch_name      ?? null,
        upi_id:                profile.upi_id           ?? null,
        phone:                 profile.phone            ?? null,
        bank_verified:         profile.bank_verified    ?? false,
        bank_verified_at:      profile.bank_verified_at ?? null,
      },
    });
  } catch (err: any) {
    console.error("[bank:GET] Unhandled error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch bank details" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[bank:PATCH] Unauthorized – no session");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.log("[bank:PATCH] Authenticated user:", user.id);

    // 2. Parse body
    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      console.log("[bank:PATCH] Failed to parse request body");
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }
    console.log("[bank:PATCH] Received payload:", {
      account_holder:         body.account_holder,
      bank_name:              body.bank_name,
      account_number:         body.account_number ? "***" : "(empty)",
      confirm_account_number: body.confirm_account_number ? "***" : "(empty)",
      ifsc_code:              body.ifsc_code,
      branch_name:            body.branch_name,
      upi_id:                 body.upi_id,
      phone:                  body.phone,
    });

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

    // 3. Field-by-field validation with specific messages
    console.log("[bank:PATCH] Starting validation…");

    if (!account_holder || !String(account_holder).trim()) {
      console.log("[bank:PATCH] Validation failed: account_holder missing");
      return NextResponse.json({ success: false, message: "Account holder name is required." }, { status: 400 });
    }

    if (!bank_name || !String(bank_name).trim()) {
      console.log("[bank:PATCH] Validation failed: bank_name missing");
      return NextResponse.json({ success: false, message: "Bank name is required." }, { status: 400 });
    }

    if (!account_number || !String(account_number).trim()) {
      console.log("[bank:PATCH] Validation failed: account_number missing");
      return NextResponse.json({ success: false, message: "Account number is required." }, { status: 400 });
    }

    if (!confirm_account_number || !String(confirm_account_number).trim()) {
      console.log("[bank:PATCH] Validation failed: confirm_account_number missing");
      return NextResponse.json({ success: false, message: "Please confirm your account number." }, { status: 400 });
    }

    if (String(account_number).trim() !== String(confirm_account_number).trim()) {
      console.log("[bank:PATCH] Validation failed: account numbers do not match");
      return NextResponse.json({ success: false, message: "Account numbers do not match." }, { status: 400 });
    }

    if (!ifsc_code || !String(ifsc_code).trim()) {
      console.log("[bank:PATCH] Validation failed: ifsc_code missing");
      return NextResponse.json({ success: false, message: "IFSC code is required." }, { status: 400 });
    }

    const ifscUpper = String(ifsc_code).toUpperCase().trim();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper)) {
      console.log("[bank:PATCH] Validation failed: invalid IFSC format:", ifscUpper);
      return NextResponse.json(
        { success: false, message: `IFSC code is invalid. Expected format: SBIN0001234 (4 letters · 0 · 6 alphanumeric). Got: ${ifscUpper}` },
        { status: 400 },
      );
    }

    const phoneTrimmed = phone ? String(phone).trim() : "";
    if (phoneTrimmed && !/^\d{10}$/.test(phoneTrimmed)) {
      console.log("[bank:PATCH] Validation failed: phone format invalid:", phoneTrimmed);
      return NextResponse.json(
        { success: false, message: "Mobile number must be exactly 10 digits." },
        { status: 400 },
      );
    }

    console.log("[bank:PATCH] Validation passed.");

    // 4. Look up the affiliate profile
    const adminDb = createAdminClient();
    const { data: existing, error: lookupErr } = await (adminDb as any)
      .from("affiliate_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupErr) {
      console.error("[bank:PATCH] Supabase lookup error:", lookupErr);
      return NextResponse.json({ success: false, message: "Failed to verify affiliate status." }, { status: 500 });
    }
    if (!existing) {
      console.log("[bank:PATCH] No affiliate profile found for user:", user.id);
      return NextResponse.json({ success: false, message: "No affiliate profile found for your account." }, { status: 403 });
    }
    console.log("[bank:PATCH] Found affiliate profile:", existing.id);

    // 5. Build update payload (only use columns guaranteed to exist)
    const payload: Record<string, any> = {
      account_holder:   String(account_holder).trim(),
      bank_name:        String(bank_name).trim(),
      account_number:   String(account_number).trim(),
      ifsc_code:        ifscUpper,
      branch_name:      branch_name ? String(branch_name).trim() || null : null,
      upi_id:           upi_id      ? String(upi_id).trim()      || null : null,
      phone:            phoneTrimmed || null,
      bank_verified:    false,
      bank_verified_at: null,
    };
    console.log("[bank:PATCH] Update payload keys:", Object.keys(payload));

    // 6. Execute UPDATE
    const { data: updated, error: updateErr } = await (adminDb as any)
      .from("affiliate_profiles")
      .update(payload)
      .eq("id", existing.id)   // use PK — safer than user_id
      .select("id");

    console.log("[bank:PATCH] Supabase update result:", {
      updatedRows: updated?.length ?? 0,
      error: updateErr ? { code: updateErr.code, message: updateErr.message, details: updateErr.details } : null,
    });

    if (updateErr) {
      console.error("[bank:PATCH] Supabase update failed:", updateErr);
      return NextResponse.json(
        { success: false, message: `Database error: ${updateErr.message}` },
        { status: 500 },
      );
    }

    if (!updated || updated.length === 0) {
      console.warn("[bank:PATCH] Update matched 0 rows for affiliate id:", existing.id);
      return NextResponse.json(
        { success: false, message: "Bank details could not be saved. Profile row not found." },
        { status: 500 },
      );
    }

    console.log("[bank:PATCH] Success — bank details saved for affiliate:", existing.id);
    const finalResponse = {
      success: true,
      message: "Bank details saved successfully. Pending admin verification before payouts can be processed.",
    };
    console.log("[bank:PATCH] Final response:", finalResponse);
    return NextResponse.json(finalResponse);

  } catch (err: any) {
    console.error("[bank:PATCH] Unhandled error:", err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
