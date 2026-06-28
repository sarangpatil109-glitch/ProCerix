import { NextRequest, NextResponse } from "next/server";
import { CashfreeService } from "@/services/cashfree-service";
import { PaymentService } from "@/services/payment-service";

export async function POST(req: NextRequest) {
  try {
    const payloadString = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    if (!CashfreeService.verifyWebhookSignature(payloadString, signature, timestamp)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payloadString);

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId = event.data.order.order_id;
      // Triggers success handling idempotently
      await PaymentService.handlePaymentSuccess(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
