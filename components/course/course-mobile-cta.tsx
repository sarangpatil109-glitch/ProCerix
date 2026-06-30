"use client";

import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import Script from "next/script";
import { ProductRegistry } from "@/engines/registry/product-registry";
import { useEffect, useState } from "react";

export function CourseMobileCTA({ course, userId }: { course: any; userId?: string }) {
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [finalPrice, setFinalPrice] = useState<number | undefined>();
  const [discountLabel, setDiscountLabel] = useState<string | null>(null);

  // Load coupon from localStorage and validate silently
  useEffect(() => {
    const stored = localStorage.getItem("procerix_ref");
    if (!stored || !course.price) return;
    fetch(`/api/partner/validate-coupon?code=${encodeURIComponent(stored)}&amount=${course.price}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid && data.final_amount != null) {
          setCouponCode(stored);
          setFinalPrice(data.final_amount);
          setDiscountLabel(data.discount_type === "flat"
            ? `₹${data.discount_amount} OFF with ${stored}`
            : `${data.discount_value}% OFF with ${stored}`);
        }
      })
      .catch(() => {});
  }, [course.price]);

  const { handleEnroll, isProcessing, setSdkReady } = useCourseEnrollment({
    course,
    userId,
    couponCode,
    finalPrice,
  });

  const displayPrice = finalPrice ?? course.price ?? 0;
  const originalPrice = course.original_price || ProductRegistry.getProduct(course.course_type as any)?.originalPrice || 499;

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 shadow-2xl pb-safe">
        <div className="flex items-center justify-between gap-4">
          <div>
            {discountLabel && (
              <p className="text-xs font-semibold text-green-600 mb-0.5">{discountLabel}</p>
            )}
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Price</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {displayPrice > 0 ? `₹${displayPrice}` : "Free"}
              </p>
              {displayPrice > 0 && displayPrice !== course.price && (
                <p className="text-sm text-gray-400 line-through">₹{course.price}</p>
              )}
              {displayPrice > 0 && !finalPrice && (
                <p className="text-sm text-gray-400 line-through">₹{originalPrice}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleEnroll}
            disabled={isProcessing}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 whitespace-nowrap"
          >
            {isProcessing ? "Processing..." : "Enroll Now"}
          </button>
        </div>
      </div>
    </>
  );
}
