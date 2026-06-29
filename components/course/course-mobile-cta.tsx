"use client";

import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import Script from "next/script";

export function CourseMobileCTA({ course, userId }: { course: any; userId?: string }) {
  const { handleEnroll, isProcessing, setSdkReady } = useCourseEnrollment({ course, userId });

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between shadow-2xl pb-safe">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Price</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{(course.price ?? 0) > 0 ? `₹${course.price}` : "Free"}</p>
        </div>
        <button
          onClick={handleEnroll}
          disabled={isProcessing}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
        >
          {isProcessing ? "Processing..." : "Enroll Now"}
        </button>
      </div>
    </>
  );
}
