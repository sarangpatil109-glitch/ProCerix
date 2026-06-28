import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment-service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.redirect(new URL("/checkout/error", req.url));
  }

  try {
    const adminDb = createAdminClient();
    const result = await PaymentService.verifyPayment(adminDb, orderId);
    if (result.success) {
      return NextResponse.redirect(new URL("/checkout/success", req.url));
    } else {
      return NextResponse.redirect(new URL("/checkout/cancel", req.url));
    }
  } catch (error) {
    console.error("Verification error", error);
    return NextResponse.redirect(new URL("/checkout/error", req.url));
  }
}
