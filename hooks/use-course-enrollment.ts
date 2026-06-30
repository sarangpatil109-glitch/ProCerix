"use client";

import { useState } from "react";
import { initiateCheckout } from "@/lib/meta-pixel";
import { analyticsBeginCheckout } from "@/lib/analytics";
import { trackEvent, trackApiError } from "@/lib/clarity";

export function useCourseEnrollment({
  course,
  userId,
  couponCode,
  finalPrice,
}: {
  course: any;
  userId?: string;
  couponCode?: string;
  finalPrice?: number;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);

  const handleEnroll = async () => {
    if (!userId) {
      window.location.href = `/login?redirect=/course/${course.slug}`;
      return;
    }

    if (!sdkReady) {
      setError("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    const chargeAmount = finalPrice ?? course.price ?? 0;

    initiateCheckout({ value: chargeAmount, currency: "INR" });
    analyticsBeginCheckout({ value: chargeAmount, currency: "INR", item_name: course.title });
    trackEvent("checkout");
    setIsProcessing(true);
    setError("");

    try {
      // Coupon code: explicit prop > localStorage referral
      const storedRef = typeof window !== "undefined" ? localStorage.getItem("procerix_ref") : null;
      const resolvedCoupon = couponCode || storedRef || undefined;

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.is_virtual ? undefined : course.id,
          courseSlug: course.slug,
          skillName: course.category || course.title?.replace(" Masterclass", ""),
          amount: course.price,
          referralCode: resolvedCoupon,
          couponCode: resolvedCoupon,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        trackApiError("/api/payments/create-order", res.status || 500);
        throw new Error(data.error || "Failed to create order");
      }

      // @ts-expect-error — Cashfree SDK is loaded via script tag, not typed
      const cashfree = window.Cashfree({ mode: data.mode });
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize payment");
      setIsProcessing(false);
    }
  };

  return {
    handleEnroll,
    isProcessing,
    error,
    sdkReady,
    setSdkReady,
  };
}
