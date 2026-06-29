"use client";

import { useState } from "react";

export function useCourseEnrollment({ course, userId }: { course: any; userId?: string }) {
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

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.is_virtual ? undefined : course.id,
          courseSlug: course.slug,
          skillName: course.category || course.title?.replace(" Masterclass", ""),
          amount: course.price,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create order");

      // @ts-ignore
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
