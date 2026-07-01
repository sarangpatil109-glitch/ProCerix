import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBeneficiary,
  transfer,
  affiliateBeneId,
} from "@/lib/cashfree/payout";
import { syncAffiliateWallet, sendAffiliateEmail, AFFILIATE_EMAIL_TEMPLATES } from "@/lib/affiliate";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

/**
 * PATCH /api/admin/affiliates/weekly-payouts/[id]
 * Body: { action: "approve" | "reject" | "retry", remarks?: string }
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: payoutId } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { action, remarks } = body as { action: "approve" | "reject" | "retry"; remarks?: string };

  if (!["approve", "reject", "retry"].includes(action)) {
    return NextResponse.json({ error: "action must be approve | reject | retry" }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Fetch payout with affiliate details
  const { data: payout, error: fetchErr } = await (adminDb as any)
    .from("affiliate_weekly_payouts")
    .select(`*, affiliate_profiles(*)`)
    .eq("id", payoutId)
    .maybeSingle();

  if (fetchErr || !payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  // --- REJECT ---
  if (action === "reject") {
    if (!["pending", "failed"].includes(payout.status)) {
      return NextResponse.json({ error: `Cannot reject a payout in '${payout.status}' state` }, { status: 400 });
    }
    await (adminDb as any)
      .from("affiliate_weekly_payouts")
      .update({ status: "rejected", remarks: remarks ?? "Rejected by admin", approved_by: user.email })
      .eq("id", payoutId);
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // --- APPROVE / RETRY ---
  const allowedFromStatuses = action === "retry" ? ["failed"] : ["pending"];
  if (!allowedFromStatuses.includes(payout.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} a payout in '${payout.status}' state` },
      { status: 400 }
    );
  }

  const profile = payout.affiliate_profiles;

  // Validate bank details
  if (!profile.bank_verified) {
    return NextResponse.json({ error: "Affiliate bank account is not verified by admin" }, { status: 400 });
  }
  if (!profile.account_number || !profile.ifsc_code || !profile.account_holder) {
    return NextResponse.json({ error: "Affiliate bank details are incomplete" }, { status: 400 });
  }
  if (Number(payout.amount) <= 0) {
    return NextResponse.json({ error: "Payout amount must be greater than zero" }, { status: 400 });
  }

  // Mark as processing
  await (adminDb as any)
    .from("affiliate_weekly_payouts")
    .update({
      status: "processing",
      approved_by: user.email,
      approved_at: new Date().toISOString(),
      remarks: null,
    })
    .eq("id", payoutId);

  try {
    // 1. Ensure beneficiary exists in Cashfree
    const beneId = affiliateBeneId(profile.id);
    await createBeneficiary({
      beneId,
      name: profile.account_holder,
      email: profile.email ?? "",
      phone: profile.phone ?? "9999999999",
      bankAccount: profile.account_number,
      ifsc: profile.ifsc_code,
    });

    // 2. Initiate transfer — transferId must be unique across retries
    const transferId = `AFWP${payoutId.replace(/-/g, "").slice(0, 18)}${Date.now().toString(36).toUpperCase()}`;

    await transfer({
      beneId,
      amount: Number(payout.amount),
      transferId,
      remarks: `ProCerix affiliate payout week ${payout.week_start}–${payout.week_end}`,
    });

    // 3. Mark paid, save transfer id
    await (adminDb as any)
      .from("affiliate_weekly_payouts")
      .update({
        status: "paid",
        cashfree_transfer_id: transferId,
        paid_at: new Date().toISOString(),
        remarks: remarks ?? null,
      })
      .eq("id", payoutId);

    // 4. Deduct wallet (sync recomputes from source)
    await syncAffiliateWallet(adminDb, profile.id);

    // 5. Email notification
    if (profile.email) {
      await sendAffiliateEmail(
        profile.email,
        `₹${Number(payout.amount).toFixed(2)} Payout Transferred — ProCerix`,
        AFFILIATE_EMAIL_TEMPLATES.weeklyPayoutSuccess(
          profile.name,
          Number(payout.amount),
          transferId,
          payout.week_start,
          payout.week_end
        )
      );
    }

    return NextResponse.json({ ok: true, status: "paid", transferId });

  } catch (err: any) {
    console.error("[weekly-payouts/approve] Cashfree transfer failed:", err.message);

    // Mark as failed — wallet MUST NOT change
    await (adminDb as any)
      .from("affiliate_weekly_payouts")
      .update({
        status: "failed",
        remarks: `Transfer failed: ${err.message}`,
      })
      .eq("id", payoutId);

    // Notify affiliate
    if (profile.email) {
      await sendAffiliateEmail(
        profile.email,
        "Weekly Payout Transfer Failed — ProCerix",
        AFFILIATE_EMAIL_TEMPLATES.weeklyPayoutFailed(
          profile.name,
          Number(payout.amount),
          payout.week_start,
          payout.week_end
        )
      ).catch(() => {});
    }

    return NextResponse.json(
      { error: `Cashfree transfer failed: ${err.message}`, status: "failed" },
      { status: 502 }
    );
  }
}
