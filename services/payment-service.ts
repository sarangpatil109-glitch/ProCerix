import { createClient } from "@/lib/supabase/server";
import { CashfreeService } from "./cashfree-service";
import { EnrollmentService } from "./enrollment-service";
import { GenerationService } from "./generation-service";

export class PaymentService {
  static async createCheckoutOrder(data: {
    userId: string;
    courseId?: string; // If real course
    courseSlug: string; 
    skillName: string;
    amount: number;
    email: string;
    phone: string;
    name?: string;
  }) {
    const supabase = await createClient();
    
    // 1. Create DB Payment Record (Pending)
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: data.userId,
        course_id: data.courseId || null,
        course_slug: data.courseSlug,
        skill_name: data.skillName,
        amount: data.amount,
        currency: "INR",
        status: "pending",
        cashfree_order_id: orderId
      } as any)
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);

    // 2. Call Cashfree API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cashfreeOrder = await CashfreeService.createOrder({
      order_id: orderId,
      order_amount: data.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: data.userId,
        customer_email: data.email,
        customer_phone: data.phone || "9999999999",
        customer_name: data.name
      },
      order_meta: {
        return_url: `${appUrl}/api/payments/verify?order_id=${orderId}`,
        notify_url: `${appUrl}/api/webhooks/cashfree`,
      }
    });

    return cashfreeOrder; 
  }

  static async verifyPayment(orderId: string) {
    const supabase = await createClient();
    const orderDetails = await CashfreeService.verifyOrder(orderId);
    
    if (orderDetails.order_status === "PAID") {
      await this.handlePaymentSuccess(orderId, supabase);
      return { success: true };
    }
    
    return { success: false, status: orderDetails.order_status };
  }

  static async handlePaymentSuccess(orderId: string, supabaseClient?: any) {
    const supabase = supabaseClient || await createClient();
    
    // 1. Fetch Payment Record
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("cashfree_order_id", orderId)
      .single();
      
    if (error || !payment) throw new Error("Payment not found");
    if (payment.status === "success") return payment; // Idempotency protection

    // 2. Mark as success securely
    await supabase
      .from("payments")
      .update({ status: "success", updated_at: new Date().toISOString() } as any)
      .eq("id", payment.id);

    // 3. Trigger Generation or Enrollment (Engine reuse)
    await GenerationService.handleCoursePurchase(
      payment.user_id,
      payment.course_slug,
      payment.skill_name,
      "success"
    );

    return payment;
  }

  static async getUserPayments(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        courses (
          title,
          course_type
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message);
    return data;
  }
}
