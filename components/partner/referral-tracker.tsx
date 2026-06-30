"use client";
import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Handle both ?ref= and ?coupon= as referral codes
    const ref = searchParams.get("ref") || searchParams.get("coupon");
    if (!ref) return;

    const code = ref.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) return;

    localStorage.setItem("procerix_ref", code);
    localStorage.setItem("procerix_ref_ts", Date.now().toString());

    // Only fire click tracking for ?ref= (direct URL referral links)
    // ?coupon= tracking is handled by CouponBanner
    if (searchParams.get("ref")) {
      fetch("/api/partner/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: code, landing_page: pathname }),
      }).catch(() => {});
    }
  }, [searchParams, pathname]);

  // Clean up expired refs (30 days)
  useEffect(() => {
    const ts = localStorage.getItem("procerix_ref_ts");
    if (ts && Date.now() - Number(ts) > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("procerix_ref");
      localStorage.removeItem("procerix_ref_ts");
    }
  }, []);

  return null;
}
