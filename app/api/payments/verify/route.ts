import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment-service";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/payments/verify?order_id=...
 *
 * Cashfree redirects the user's browser here after checkout.
 * This route MUST always redirect — never render JSON or stay on /api/*.
 *
 * Flow:
 *   Cashfree → GET /api/payments/verify?order_id=XXX
 *     → verify with Cashfree API
 *     → update DB + create enrollment
 *     → 302 /checkout/success?order_id=XXX   (PAID)
 *     → 302 /checkout/cancel?order_id=XXX    (EXPIRED / CANCELLED)
 *     → 302 /checkout/error?order_id=XXX     (any unexpected error)
 */
export async function GET(req: NextRequest) {
  const reqUrl    = new URL(req.url);
  const orderId   = reqUrl.searchParams.get("order_id");
  const origin    = reqUrl.origin;   // same host that Cashfree redirected to → always correct

  console.log("[verify] ▶ START", { orderId, origin });

  if (!orderId) {
    console.error("[verify] ✗ Missing order_id");
    return NextResponse.redirect(new URL("/checkout/error", origin));
  }

  const successUrl = new URL(`/checkout/success?order_id=${orderId}`, origin);
  const cancelUrl  = new URL(`/checkout/cancel?order_id=${orderId}`,  origin);
  const errorUrl   = new URL(`/checkout/error?order_id=${orderId}`,   origin);

  // ── Step 1: Admin DB client ───────────────────────────────────────────
  let adminDb: ReturnType<typeof createAdminClient>;
  try {
    adminDb = createAdminClient();
    console.log("[verify] Step 1: ✓ admin client ready");
  } catch (err: any) {
    console.error("[verify] Step 1: ✗ createAdminClient failed", err?.message);
    return NextResponse.redirect(errorUrl);
  }

  // ── Step 2: Fetch order status from Cashfree ──────────────────────────
  let orderStatus: string;
  try {
    console.log("[verify] Step 2: calling Cashfree verifyOrder", orderId);
    const { CashfreeService } = await import("@/services/cashfree-service");
    const details = await CashfreeService.verifyOrder(orderId);
    orderStatus   = details.order_status;
    console.log("[verify] Step 2: ✓ order_status =", orderStatus);
  } catch (err: any) {
    console.error("[verify] Step 2: ✗ Cashfree verifyOrder threw", err?.message);
    return NextResponse.redirect(errorUrl);
  }

  // ── Step 3: PAID ──────────────────────────────────────────────────────
  if (orderStatus === "PAID") {
    try {
      console.log("[verify] Step 3: PAID → handlePaymentSuccess");
      await PaymentService.handlePaymentSuccess(adminDb, orderId);
      console.log("[verify] Step 3: ✓ handlePaymentSuccess complete");
    } catch (err: any) {
      // Payment is confirmed PAID by Cashfree — DB already updated inside
      // handlePaymentSuccess before the error occurred. Always show success
      // so the user knows their money went through.
      console.error("[verify] Step 3: handlePaymentSuccess threw (payment confirmed by Cashfree):", {
        message: err?.message,
        stack: err?.stack,
        orderId,
      });
    }
    console.log("[verify] ✓ PAID → redirecting to /checkout/success");
    return NextResponse.redirect(successUrl);
  }

  // ── Step 4: EXPIRED / CANCELLED ──────────────────────────────────────
  if (["EXPIRED", "CANCELLED"].includes(orderStatus)) {
    try {
      console.log("[verify] Step 4:", orderStatus, "→ handlePaymentFailure");
      await PaymentService.handlePaymentFailure(adminDb, orderId, orderStatus.toLowerCase());
      console.log("[verify] Step 4: ✓ handlePaymentFailure complete");
    } catch (err: any) {
      console.error("[verify] Step 4: handlePaymentFailure threw (non-fatal):", err?.message);
    }
    console.log("[verify] ✗", orderStatus, "→ /checkout/cancel");
    return NextResponse.redirect(cancelUrl);
  }

  // ── Step 5: Any other status (ACTIVE, PENDING, etc.) ─────────────────
  console.log("[verify] Step 5: unhandled status", orderStatus, "→ /checkout/cancel");
  return NextResponse.redirect(cancelUrl);
}
