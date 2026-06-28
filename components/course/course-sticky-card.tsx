"use client";

import { CheckCircle2, Shield, Infinity } from "lucide-react";
import { useState } from "react";
import Script from "next/script";

export function CourseStickyCard({ course, userId }: { course: any; userId?: string }) {
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

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

        <div className="space-y-8">
          <div className="space-y-2">
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {course.price > 0 ? `$${course.price}` : "Free"}
            </div>
            {course.price > 0 && (
              <div className="text-gray-500 dark:text-gray-400 line-through">
                ${(course.price * 1.5).toFixed(2)}
              </div>
            )}
          </div>

          <button
            onClick={handleEnroll}
            disabled={isProcessing}
            className="w-full py-4 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isProcessing ? "Processing..." : "Enroll Now"}
          </button>

          {error && (
            <p className="text-sm text-red-500 text-center -mt-4">{error}</p>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">This course includes:</h4>
            <ul className="space-y-3">
              {[
                { icon: Infinity, text: "Full lifetime access" },
                { icon: Shield, text: "Industry recognized certificate" },
                { icon: CheckCircle2, text: "Hands-on project experience" },
                { icon: CheckCircle2, text: "Access on mobile and TV" },
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <feature.icon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
