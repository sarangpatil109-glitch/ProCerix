"use server";
import { PaymentService } from "@/services/payment-service";

export async function createCashfreeOrderAction(data: any) {
  try {
    const order = await PaymentService.createCheckoutOrder(data);
    return { success: true, payment_session_id: order.payment_session_id };
  } catch (error: any) {
    return { error: error.message };
  }
}
