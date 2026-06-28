import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { PaymentService } from "@/services/payment-service";

async function getPaymentsHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const payments = await PaymentService.getUserPayments(userId);
  return NextResponse.json({ data: payments });
}

export const GET = withApiAuth(getPaymentsHandler);
