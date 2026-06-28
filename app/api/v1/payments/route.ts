import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { PaymentService } from "@/services/payment-service";
import { createAdminClient } from "@/lib/supabase/admin";

async function getPaymentsHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const payments = await PaymentService.getUserPayments(adminDb, userId);
  return NextResponse.json({ data: payments });
}

export const GET = withApiAuth(getPaymentsHandler);
