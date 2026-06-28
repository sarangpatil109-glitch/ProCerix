"use server";
import { PaymentService } from "@/services/payment-service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createCashfreeOrderAction(data: any) {
  try {
    const adminDb = createAdminClient();
    const order = await PaymentService.createCheckoutOrder(adminDb, data);
    return { success: true, payment_session_id: order.payment_session_id };
  } catch (error: any) {
    return { error: error.message };
  }
}
