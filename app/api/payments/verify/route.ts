import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment-service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url);
  const orderId = reqUrl.searchParams.get("order_id");

  console.log("[verify] ▶ START VERIFY", {
    orderId,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "(not set — falling back to localhost:3000)",
    env: process.env.CASHFREE_ENV ?? "(not set)",
  });

  if (!orderId) {
    console.error("[verify] ✗ Missing order_id in query string");
    return NextResponse.redirect(new URL("/checkout/error", req.url));
  }

  // ── Step 1: Admin DB client ───────────────────────────────────────────────
  let adminDb: ReturnType<typeof createAdminClient>;
  try {
    console.log("[verify] Step 1: Creating admin DB client");
    adminDb = createAdminClient();
    console.log("[verify] Step 1: ✓ Admin DB client ready");
  } catch (err: any) {
    console.error("[verify] Step 1: ✗ createAdminClient failed", {
      message: err?.message ?? String(err),
      file: "lib/supabase/admin.ts",
    });
    return NextResponse.redirect(new URL("/checkout/error", req.url));
  }

  // ── Step 2: Fetch order status from Cashfree ──────────────────────────────
  let orderStatus: string;
  try {
    console.log("[verify] Step 2: Calling Cashfree verifyOrder", { orderId });
    const { CashfreeService } = await import("@/services/cashfree-service");
    const orderDetails = await CashfreeService.verifyOrder(orderId);
    orderStatus = orderDetails.order_status;
    console.log("[verify] Step 2: ✓ Cashfree response", { order_status: orderStatus });
  } catch (err: any) {
    console.error("[verify] Step 2: ✗ Cashfree verifyOrder failed", {
      message: err?.message ?? String(err),
      file: "services/cashfree-service.ts → verifyOrder",
    });
    return NextResponse.redirect(new URL("/checkout/error", req.url));
  }

  // ── Step 3: Handle PAID status ────────────────────────────────────────────
  if (orderStatus === "PAID") {
    try {
      console.log("[verify] Step 3: Payment PAID — calling handlePaymentSuccess");
      await PaymentService.handlePaymentSuccess(adminDb, orderId);
      console.log("[verify] Step 3: ✓ handlePaymentSuccess complete");
    } catch (err: any) {
      // Payment is confirmed by Cashfree. Even if post-payment steps fail,
      // we redirect to success so the user knows their payment went through.
      // The DB already has status="success" from inside handlePaymentSuccess.
      console.error("[verify] Step 3: ✗ handlePaymentSuccess threw (payment already recorded)", {
        message: err?.message ?? String(err),
        stack: err?.stack,
        orderId,
        note: "Redirecting to /checkout/success anyway — payment was confirmed by Cashfree",
      });
    }

    console.log("[verify] ✓ SUCCESS → /checkout/success");
    return NextResponse.redirect(new URL("/checkout/success", req.url));
  }

  // ── Step 4: Handle EXPIRED / CANCELLED ───────────────────────────────────
  if (["EXPIRED", "CANCELLED"].includes(orderStatus)) {
    try {
      console.log("[verify] Step 4: Payment", orderStatus, "— calling handlePaymentFailure");
      await PaymentService.handlePaymentFailure(adminDb, orderId, orderStatus.toLowerCase());
      console.log("[verify] Step 4: ✓ handlePaymentFailure complete");
    } catch (err: any) {
      console.error("[verify] Step 4: ✗ handlePaymentFailure threw", {
        message: err?.message ?? String(err),
        orderId,
      });
    }

    console.log("[verify] ✗ CANCELLED/EXPIRED → /checkout/cancel");
    return NextResponse.redirect(new URL("/checkout/cancel", req.url));
  }

  // ── Step 5: Any other status (ACTIVE, etc.) ───────────────────────────────
  console.log("[verify] Step 5: Unhandled order_status", orderStatus, "→ /checkout/cancel");
  return NextResponse.redirect(new URL("/checkout/cancel", req.url));
}
