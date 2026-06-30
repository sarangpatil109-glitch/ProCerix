"use client";

import { CheckCircle2, Shield, Infinity, Tag, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { ProductRegistry } from "@/engines/registry/product-registry";

interface CouponResult {
  valid: boolean;
  partner_name?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  final_amount?: number;
  error?: string;
}

export function CourseStickyCard({ course, userId }: { course: any; userId?: string }) {
  const [couponInput, setCouponInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("procerix_ref") ?? "";
  });
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [validating, setValidating] = useState(false);
  const autoValidatedRef = useRef(false);

  const finalPrice = couponResult?.valid && couponResult.final_amount != null
    ? couponResult.final_amount
    : course.price;

  const { handleEnroll, isProcessing, error, setSdkReady } = useCourseEnrollment({
    course,
    userId,
    couponCode: appliedCoupon || undefined,
    finalPrice,
  });

  // Auto-validate stored coupon on mount
  useEffect(() => {
    if (autoValidatedRef.current || !couponInput) return;
    autoValidatedRef.current = true;
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    fetch(`/api/partner/validate-coupon?code=${encodeURIComponent(code)}&amount=${course.price}`)
      .then(r => r.json())
      .then((data: CouponResult) => {
        setCouponResult(data);
        if (data.valid) setAppliedCoupon(code);
      })
      .catch(() => {})
      .finally(() => setValidating(false));
  }, [couponInput, course.price]);

  const validateCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    setCouponResult(null);
    try {
      const res = await fetch(`/api/partner/validate-coupon?code=${encodeURIComponent(code)}&amount=${course.price}`);
      const data: CouponResult = await res.json();
      setCouponResult(data);
      if (data.valid) {
        setAppliedCoupon(code);
        localStorage.setItem("procerix_ref", code);
      } else {
        setAppliedCoupon("");
      }
    } catch {
      setCouponResult({ valid: false, error: "Could not validate coupon" });
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponInput("");
    setAppliedCoupon("");
    setCouponResult(null);
  };

  const originalPrice = course.original_price || ProductRegistry.getProduct(course.course_type as any)?.originalPrice || 499;

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none relative overflow-hidden pointer-events-auto z-20">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600 z-0" />

        <div className="space-y-6 relative z-10 pointer-events-auto">
          {/* Price block */}
          <div className="space-y-1">
            {couponResult?.valid && couponResult.discount_amount ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹{couponResult.final_amount}</span>
                  <span className="text-lg text-gray-400 line-through">₹{course.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {couponResult.discount_type === "flat"
                      ? `₹${couponResult.discount_amount} OFF`
                      : `${couponResult.discount_value}% OFF`}
                  </span>
                  <span className="text-xs text-gray-500">You save ₹{couponResult.discount_amount}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {course.price > 0 ? `₹${course.price}` : "Free"}
                </div>
                {course.price > 0 && (
                  <span className="text-sm text-gray-500 line-through font-normal">₹{originalPrice}</span>
                )}
              </>
            )}
          </div>

          {/* Coupon applied badge */}
          {couponResult?.valid && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Coupon Applied: {appliedCoupon}</p>
                {couponResult.partner_name && (
                  <p className="text-xs text-green-600 dark:text-green-500">Referred by {couponResult.partner_name}</p>
                )}
              </div>
              <button onClick={removeCoupon} className="shrink-0 text-green-500 hover:text-green-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Coupon input */}
          {!couponResult?.valid && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> Coupon / Referral Code
              </label>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && validateCoupon()}
                  placeholder="e.g. PATIL50"
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                />
                <button
                  onClick={validateCoupon}
                  disabled={!couponInput.trim() || validating}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </button>
              </div>
              {couponResult?.error && (
                <p className="text-xs text-red-500">{couponResult.error}</p>
              )}
            </div>
          )}

          {/* Enroll button */}
          <button
            onClick={handleEnroll}
            disabled={isProcessing}
            className="w-full py-4 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 relative z-30 pointer-events-auto cursor-pointer"
          >
            {isProcessing ? "Processing..." : couponResult?.valid
              ? `Enroll Now — ₹${couponResult.final_amount}`
              : "Enroll Now"}
          </button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">This course includes:</h4>
            <ul className="space-y-2.5">
              {[
                { icon: Infinity, text: "Full lifetime access" },
                { icon: Shield, text: "Industry recognized certificate" },
                { icon: CheckCircle2, text: "Hands-on project experience" },
                { icon: CheckCircle2, text: "Access on mobile and TV" },
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <feature.icon className="w-4 h-4 text-green-500 shrink-0" />
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
