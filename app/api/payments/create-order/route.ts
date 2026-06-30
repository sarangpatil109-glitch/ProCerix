import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentService } from "@/services/payment-service";
import { ProductRegistry, ProductType } from "@/engines/registry/product-registry";
import { calcDiscount } from "@/lib/partner";

export async function POST(req: NextRequest) {
  // Step 1: Authenticate user.
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn("[create-order] Unauthenticated request");
    return NextResponse.json({ error: "You must be logged in to enroll." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { courseId, courseSlug, skillName, phone, referralCode, couponCode } = body;

  if (!courseSlug) {
    return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
  }

  console.log(`[create-order] user=${user.id} email=${user.email} slug=${courseSlug}`);

  // Step 2: Derive canonical amount server-side. Never trust client amount.
  let canonicalAmount: number;
  let resolvedCourseId: string | undefined = courseId;

  try {
    const adminDb = createAdminClient();
    const { data: dbCourse } = await adminDb
      .from("courses")
      .select("id, price, course_type")
      .eq("slug", courseSlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (dbCourse) {
      resolvedCourseId = resolvedCourseId || dbCourse.id;
      const registryProduct = ProductRegistry.getProduct(dbCourse.course_type as ProductType);
      canonicalAmount = registryProduct?.defaultPrice ?? Number(dbCourse.price);
      console.log(`[create-order] DB course found course_type=${dbCourse.course_type} canonical=₹${canonicalAmount}`);
    } else {
      const registryProduct = ProductRegistry.getProductBySlug(courseSlug);
      canonicalAmount =
        registryProduct?.defaultPrice ??
        ProductRegistry.getProduct("certificate")!.defaultPrice;
      console.log(`[create-order] Virtual/product slug=${courseSlug} canonical=₹${canonicalAmount}`);
    }
  } catch (lookupError: any) {
    console.error("[create-order] Price lookup failed:", lookupError);
    return NextResponse.json(
      { error: "Could not determine course price. Please try again." },
      { status: 500 },
    );
  }

  // Step 2b: Validate coupon/referral code — apply discount if partner coupon.
  let validatedCouponCode: string | undefined;
  let validatedPartnerId: string | undefined;
  let discountAmount = 0;
  let finalAmount = canonicalAmount;

  const incomingCode = couponCode || referralCode;
  if (incomingCode) {
    const adminDb2 = createAdminClient();
    const { data: partnerRow } = await (adminDb2 as any)
      .from("partners")
      .select("id, status, discount_type, discount_value, commission_percentage")
      .eq("referral_code", String(incomingCode).toUpperCase())
      .maybeSingle();

    if (partnerRow?.status === "approved") {
      validatedCouponCode = String(incomingCode).toUpperCase();
      validatedPartnerId = partnerRow.id;

      const disc = calcDiscount(
        canonicalAmount,
        partnerRow.discount_type || "percentage",
        Number(partnerRow.discount_value ?? 10),
      );
      discountAmount = disc.discountAmount;
      finalAmount = disc.finalAmount;
      console.log(`[create-order] Coupon ${validatedCouponCode} applied — discount=₹${discountAmount} final=₹${finalAmount}`);
    }
  }

  // Step 3: Create payment record + Cashfree order.
  try {
    const adminDb = createAdminClient();
    const order = await PaymentService.createCheckoutOrder(adminDb, {
      userId: user.id,
      courseId: resolvedCourseId,
      courseSlug,
      skillName: skillName || courseSlug,
      amount: finalAmount,
      originalAmount: canonicalAmount,
      discountAmount,
      email: user.email!,
      phone: phone || "9999999999",
      name:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email ||
        undefined,
      referralCode: validatedCouponCode,
      partnerId: validatedPartnerId,
      couponCode: validatedCouponCode,
    });

    console.log(`[create-order] Success — session=${order.payment_session_id} amount=₹${finalAmount}`);

    return NextResponse.json({
      payment_session_id: order.payment_session_id,
      mode: process.env.CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
      final_amount: finalAmount,
      discount_amount: discountAmount,
    });
  } catch (error: any) {
    console.error("[create-order] Payment creation failed:", error);

    const msg: string = error.message ?? "";
    if (msg.includes("Profile sync")) {
      return NextResponse.json(
        { error: "Account setup incomplete. Please refresh and try again." },
        { status: 500 },
      );
    }
    if (msg.includes("Cashfree")) {
      return NextResponse.json(
        { error: "Payment gateway error. Please try again in a moment." },
        { status: 502 },
      );
    }
    if (msg.includes("CASHFREE_APP_ID") || msg.includes("CASHFREE_SECRET")) {
      return NextResponse.json(
        { error: "Payment gateway not configured. Contact support." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Payment initialization failed. Please try again." },
      { status: 500 },
    );
  }
}
