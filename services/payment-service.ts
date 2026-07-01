import { createAdminClient } from "@/lib/supabase/admin";
import { CashfreeService } from "./cashfree-service";
import { GenerationService } from "./generation-service";
import { calcCommission, calcDiscount, sendPartnerEmail, PARTNER_EMAIL_TEMPLATES } from "@/lib/partner";
import { calcAffiliateDiscount, sendAffiliateEmail, AFFILIATE_EMAIL_TEMPLATES } from "@/lib/affiliate";

export class PaymentService {
  static async createCheckoutOrder(
    supabase: any,
    data: {
      userId: string;
      courseId?: string;
      courseSlug: string;
      skillName: string;
      amount: number;
      originalAmount?: number;
      discountAmount?: number;
      email: string;
      phone: string;
      name?: string;
      referralCode?: string;
      partnerId?: string;
      couponCode?: string;
      /** Origin derived from the live request — never hardcode localhost here */
      appUrl: string;
    }
  ) {
    console.log("[create-order] authenticated user", { userId: data.userId, email: data.email });
    console.log("[create-order] profile ensuring...", { userId: data.userId });

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
    console.log("[create-order] profile", { id: data.userId, status: "OK" });

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log("[create-order] course", { courseId: data.courseId, courseSlug: data.courseSlug });
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
        referral_code: data.couponCode || data.referralCode || null,
        partner_id: data.partnerId || null,
        discount_amount: data.discountAmount || 0,
        final_amount: data.amount,
      } as any)
      .select()
      .single();

    if (paymentError) {
      console.error("[payment] Payment insert failed:", paymentError);
      throw new Error(`Payment record creation failed: ${paymentError.message}`);
    }
    console.log("[create-order] payment created", { paymentId: payment.id, orderId });

    try {
      const { error: eventError } = await (supabase as any)
        .from("payment_events")
        .insert({
          payment_id: payment.id,
          event_type: "payment_created",
          cashfree_order_id: orderId,
          status: "pending",
        });
      if (eventError) throw eventError;
    } catch (e: any) {
      console.error("[payment] payment_events insert failed:", e);
    }

    const appUrl = data.appUrl;
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

    console.log("[create-order] Cashfree response", { cf_order_id: cashfreeOrder.cf_order_id ?? cashfreeOrder.order_id });
    return cashfreeOrder;
  }

  static async verifyPayment(supabase: any, orderId: string) {
    const orderDetails = await CashfreeService.verifyOrder(orderId);

    if (orderDetails.order_status === "PAID") {
      await this.handlePaymentSuccess(supabase, orderId);
      return { success: true };
    }

    if (["EXPIRED", "CANCELLED"].includes(orderDetails.order_status)) {
      await this.handlePaymentFailure(supabase, orderId, orderDetails.order_status.toLowerCase());
    }

    return { success: false, status: orderDetails.order_status };
  }

  static async handlePaymentSuccess(supabase: any, orderId: string) {
    console.log("[payment] handlePaymentSuccess →", orderId);

    console.log("[payment] Step A: Fetching payment record");
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("cashfree_order_id", orderId)
      .single();

    if (error || !payment) throw new Error(`Payment not found for orderId: ${orderId}`);
    console.log("[payment] Step A: ✓ payment found", { id: payment.id, status: payment.status });

    if (payment.status === "success") {
      console.log("[payment] Step A: already success, skipping duplicate processing");
      return payment;
    }

    console.log("[payment] Step B: Updating payment status → success");
    await supabase
      .from("payments")
      .update({
        status: "success",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", payment.id);
    console.log("[payment] Step B: ✓ payment status updated");

    try {
      const { error: eventError } = await (supabase as any)
        .from("payment_events")
        .insert({
          payment_id: payment.id,
          event_type: "payment_success",
          cashfree_order_id: orderId,
          status: "success",
        });
      if (eventError) throw eventError;
      console.log("[payment] Step B2: ✓ payment_events recorded");
    } catch (e: any) {
      console.error("[payment] Step B2: payment_events insert failed (non-fatal):", e);
    }

    const courseSlug: string = payment.course_slug || payment.skill_name || orderId;
    const skillName: string = payment.skill_name || courseSlug;
    console.log("[payment] Step C: handleCoursePurchase", { courseSlug, skillName, userId: payment.user_id });
    try {
      await GenerationService.handleCoursePurchase(
        payment.user_id,
        courseSlug,
        skillName,
        "success",
        supabase,
      );
      console.log("[payment] Step C: ✓ handleCoursePurchase done");
    } catch (genErr: any) {
      console.error("[payment] Step C: handleCoursePurchase failed (non-fatal — payment already recorded):", {
        message: genErr?.message ?? String(genErr),
        stack: genErr?.stack,
      });
    }

    // Record partner commission if coupon was used
    console.log("[payment] Step D: referral_code=", payment.referral_code, "partner_id=", payment.partner_id);
    if (payment.referral_code && payment.partner_id) {
      try {
        const { data: partnerRow } = await (supabase as any)
          .from("partners")
          .select("commission_percentage, commission_rate, email, full_name, discount_type, discount_value")
          .eq("id", payment.partner_id)
          .single();

        // Commission is calculated on the ORIGINAL amount (pre-discount), partners earn on gross
        const originalAmount = Number(payment.discount_amount ?? 0) + Number(payment.amount);
        const commRate = Number(partnerRow?.commission_percentage ?? partnerRow?.commission_rate ?? 50);
        const commission = calcCommission(originalAmount, commRate);
        const discountAmount = Number(payment.discount_amount ?? 0);

        // Record in partner_sales (coupon-based)
        await (supabase as any).from("partner_sales").insert({
          partner_id: payment.partner_id,
          payment_id: payment.id,
          order_id: orderId,
          student_id: payment.user_id,
          product_type: "certificate",
          coupon_code: payment.referral_code,
          purchase_amount: originalAmount,
          discount_amount: discountAmount,
          commission_amount: commission,
          payment_status: "completed",
        });

        // Also record in referral_commissions for backward compat
        await (supabase as any).from("referral_commissions").insert({
          partner_id: payment.partner_id,
          payment_id: payment.id,
          referral_code: payment.referral_code,
          purchase_amount: originalAmount,
          commission_rate: commRate,
          commission_amount: commission,
          status: "pending",
          student_id: payment.user_id,
          course_slug: courseSlug,
          skill_name: skillName,
        }).catch(() => {});

        // Email notification
        if (partnerRow?.email) {
          const tpl = PARTNER_EMAIL_TEMPLATES.purchase(partnerRow.full_name, originalAmount, commission);
          await sendPartnerEmail(partnerRow.email, tpl.subject, tpl.html);
        }
      } catch (commErr) {
        console.error("[payment] Partner commission recording failed:", commErr);
      }
    }

    // Record affiliate commission if an affiliate coupon was used (and not already a partner coupon)
    console.log("[payment] Step E: affiliate commission check");
    if (payment.referral_code && !payment.partner_id) {
      try {
        const adminDb = createAdminClient();
        const { data: affiliateProfile } = await (adminDb as any)
          .from("affiliate_profiles")
          .select("id, commission_percentage, discount_type, discount_value, email, name")
          .eq("coupon_code", payment.referral_code.toUpperCase())
          .eq("status", "active")
          .maybeSingle();

        if (affiliateProfile) {
          const originalAmount = Number(payment.discount_amount ?? 0) + Number(payment.amount);
          const commRate = Number(affiliateProfile.commission_percentage ?? 50);
          const commission = calcCommission(originalAmount, commRate);
          const discountAmount = Number(payment.discount_amount ?? 0);

          await (adminDb as any).from("affiliate_sales").insert({
            affiliate_id: affiliateProfile.id,
            payment_id: payment.id,
            order_id: orderId,
            student_id: payment.user_id,
            product_type: "certificate",
            coupon_code: payment.referral_code,
            purchase_amount: originalAmount,
            discount_amount: discountAmount,
            final_amount: Number(payment.amount),
            commission_amount: commission,
            payment_status: "completed",
          });

          if (affiliateProfile.email) {
            sendAffiliateEmail(
              affiliateProfile.email,
              "💰 Commission Earned!",
              AFFILIATE_EMAIL_TEMPLATES.commissionEarned(affiliateProfile.name, commission.toFixed(2), payment.referral_code)
            ).catch(() => {});
          }
        }
      } catch (affErr) {
        console.error("[payment] Affiliate commission recording failed:", affErr);
      }
    }

    console.log("[payment] ✓ handlePaymentSuccess complete for orderId", orderId);
    return payment;
  }

  static async handlePaymentFailure(supabase: any, orderId: string, reason?: string) {
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

    // Mark partner_sales as failed if exists
    if (payment.id) {
      await (supabase as any).from("partner_sales").update({ payment_status: "failed" }).eq("payment_id", payment.id).catch(() => {});
    }

    try {
      const { error: eventError } = await (supabase as any)
        .from("payment_events")
        .insert({
          payment_id: payment.id,
          event_type: "payment_failed",
          cashfree_order_id: orderId,
          status: reason || "failed",
        });
      if (eventError) throw eventError;
    } catch (e: any) {
      console.error("[payment] payment_events insert failed:", e);
    }
  }

  static async getUserPayments(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select(`*, courses(title, course_type)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }
}
