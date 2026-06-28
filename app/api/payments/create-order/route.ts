import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "@/services/payment-service";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, courseSlug, skillName, amount, phone } = await req.json();

    if (!courseSlug || amount == null) {
      return NextResponse.json({ error: "courseSlug and amount are required" }, { status: 400 });
    }

    const order = await PaymentService.createCheckoutOrder({
      userId: user.id,
      courseId,
      courseSlug,
      skillName,
      amount,
      email: user.email!,
      phone: phone || "9999999999",
      name: (user.user_metadata?.full_name as string | undefined) || user.email || undefined,
    });

    return NextResponse.json({
      payment_session_id: order.payment_session_id,
      mode: process.env.CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
