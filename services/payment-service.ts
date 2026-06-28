import { createAdminClient } from "@/lib/supabase/admin";
import { CashfreeService } from "./cashfree-service";
import { GenerationService } from "./generation-service";

export class PaymentService {
  private static db() {
    return createAdminClient();
  }

  static async createCheckoutOrder(data: {
    userId: string;
    courseId?: string;
    courseSlug: string;
    skillName: string;
    amount: number;
    email: string;
    phone: string;
    name?: string;
  }) {
    const supabase = this.db();

    // Step 1: Ensure profile row exists.
    // payments.user_id has a FK to profiles.id (not auth.users directly).
    // OAuth logins create an auth.users row but NOT a profiles row automatically.
    console.log(`[payment] Ensuring profile exists for user ${data.userId}`);
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.userId,
          first_name: data.name?.split(" ")[0] ?? "",
          last_name: data.name?.split(" ").slice(1).join(" ") ?? "",
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    if (profileError) {
      console.error("[payment] Profile upsert failed:", profileError);
      throw new Error(`Profile sync failed: ${profileError.message}`);
    }
    console.log(`[payment] Profile OK for user ${data.userId}`);

    // Step 2: Insert payment record.
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log(`[payment] Inserting payment record orderId=${orderId} amount=${data.amount}`);

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: data.userId,
        course_id: data.courseId || null,
        course_slug: data.courseSlug,
        skill_name: data.skillName,
        amount: data.amount,
        currency: "INR",
        status: "pending",
        cashfree_order_id: orderId,
      } as any)
      .select()
      .single();

    if (paymentError) {
      console.error("[payment] Payment insert failed:", paymentError);
      throw new Error(`Payment record creation failed: ${paymentError.message}`);
    }
    console.log(`[payment] Payment record created id=${payment.id}`);

    // Step 3: Log payment_created event (best-effort).
    await (supabase as any)
      .from("payment_events")
      .insert({
        payment_id: payment.id,
        event_type: "payment_created",
        cashfree_order_id: orderId,
        status: "pending",
      })
      .catch((e: any) => console.error("[payment] payment_events insert failed:", e));

    // Step 4: Create Cashfree order.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log(`[payment] Creating Cashfree order appUrl=${appUrl} env=${process.env.CASHFREE_ENV}`);

    const cashfreeOrder = await CashfreeService.createOrder({
      order_id: orderId,
      order_amount: data.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: data.userId,
        customer_email: data.email,
        customer_phone: data.phone || "9999999999",
        customer_name: data.name,
      },
      order_meta: {
        return_url: `${appUrl}/api/payments/verify?order_id=${orderId}`,
        notify_url: `${appUrl}/api/webhooks/cashfree`,
      },
    });

    console.log(
      `[payment] Cashfree order created cf_order_id=${cashfreeOrder.cf_order_id ?? cashfreeOrder.order_id}`,
    );
    return cashfreeOrder;
  }

  static async verifyPayment(orderId: string) {
    const orderDetails = await CashfreeService.verifyOrder(orderId);

    if (orderDetails.order_status === "PAID") {
      await this.handlePaymentSuccess(orderId);
      return { success: true };
    }

    if (["EXPIRED", "CANCELLED"].includes(orderDetails.order_status)) {
      await this.handlePaymentFailure(orderId, orderDetails.order_status.toLowerCase());
    }

    return { success: false, status: orderDetails.order_status };
  }

  static async handlePaymentSuccess(orderId: string) {
    const supabase = this.db();

    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("cashfree_order_id", orderId)
      .single();

    if (error || !payment) throw new Error(`Payment not found for orderId: ${orderId}`);

    // Idempotency guard — already processed
    if (payment.status === "success") return payment;

    await supabase
      .from("payments")
      .update({
        status: "success",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", payment.id);

    await (supabase as any)
      .from("payment_events")
      .insert({
        payment_id: payment.id,
        event_type: "payment_success",
        cashfree_order_id: orderId,
        status: "success",
      })
      .catch((e: any) => console.error("[payment] payment_events insert failed:", e));

    // Create enrollment using admin client so RLS is bypassed in webhook context.
    const courseSlug: string = payment.course_slug || payment.skill_name || orderId;
    const skillName: string = payment.skill_name || courseSlug;
    await GenerationService.handleCoursePurchase(
      payment.user_id,
      courseSlug,
      skillName,
      "success",
      supabase,
    );

    return payment;
  }

  static async handlePaymentFailure(orderId: string, reason?: string) {
    const supabase = this.db();

    const { data: payment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("cashfree_order_id", orderId)
      .single();

    if (!payment || payment.status !== "pending") return;

    await supabase
      .from("payments")
      .update({ status: "failed", updated_at: new Date().toISOString() } as any)
      .eq("id", payment.id);

    await (supabase as any)
      .from("payment_events")
      .insert({
        payment_id: payment.id,
        event_type: "payment_failed",
        cashfree_order_id: orderId,
        status: reason || "failed",
      })
      .catch((e: any) => console.error("[payment] payment_events insert failed:", e));
  }

  static async getUserPayments(userId: string) {
    const supabase = this.db();
    const { data, error } = await supabase
      .from("payments")
      .select(`*, courses(title, course_type)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }
}
