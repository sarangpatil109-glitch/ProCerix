import { NextRequest, NextResponse } from "next/server";
import { CashfreeService } from "@/services/cashfree-service";
import { PaymentService } from "@/services/payment-service";

export async function POST(req: NextRequest) {
  let payloadString = "";

  try {
    payloadString = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  const signature = req.headers.get("x-webhook-signature") || "";
  const timestamp = req.headers.get("x-webhook-timestamp") || "";

  if (!CashfreeService.verifyWebhookSignature(payloadString, signature, timestamp)) {
    console.error("[cashfree-webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(payloadString);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId: string | undefined = event?.data?.order?.order_id;
  if (!orderId) {
    // No order ID — acknowledge and ignore
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        await PaymentService.handlePaymentSuccess(orderId);
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        await PaymentService.handlePaymentFailure(orderId, "payment_failed");
        break;

      case "PAYMENT_USER_DROPPED_WEBHOOK":
        await PaymentService.handlePaymentFailure(orderId, "user_dropped");
        break;

      default:
        console.log(`[cashfree-webhook] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Log but always return 200 — prevents Cashfree from retrying infinitely.
    // Idempotency guards inside handlePaymentSuccess prevent double processing.
    console.error(`[cashfree-webhook] error processing ${event.type} for ${orderId}:`, err);
  }

  return NextResponse.json({ received: true });
}
