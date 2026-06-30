"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, X, Tag } from "lucide-react";

interface CouponInfo {
  code: string;
  partnerName: string;
  discountLabel: string;
}

export function CouponBanner() {
  const searchParams = useSearchParams();
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("coupon");
    if (!raw) return;

    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) return;

    // Skip if already stored and same code
    const existing = localStorage.getItem("procerix_ref");
    if (existing === code && sessionStorage.getItem("coupon_banner_shown") === code) return;

    fetch(`/api/partner/validate-coupon?code=${encodeURIComponent(code)}&amount=99`)
      .then(r => r.json())
      .then(data => {
        if (!data.valid) return;

        localStorage.setItem("procerix_ref", code);
        localStorage.setItem("procerix_ref_ts", Date.now().toString());
        sessionStorage.setItem("coupon_banner_shown", code);

        setCouponInfo({
          code,
          partnerName: data.partner_name || "",
          discountLabel: data.discount_type === "flat"
            ? `₹${data.discount_value} off`
            : `${data.discount_value}% off`,
        });

        // Track event
        fetch("/api/partner/track-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, event: "coupon_auto_applied" }),
        }).catch(() => {});

        // Also track as click
        fetch("/api/partner/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referral_code: code, landing_page: window.location.pathname }),
        }).catch(() => {});
      })
      .catch(() => {});
  }, [searchParams]);

  if (!couponInfo || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base leading-tight">
                🎉 Coupon <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded">{couponInfo.code}</span> Applied Successfully!
              </p>
              <p className="text-xs sm:text-sm text-green-100 mt-0.5 flex items-center gap-1.5">
                <Tag className="w-3 h-3 shrink-0" />
                <span>
                  {couponInfo.discountLabel} discount will be automatically applied at checkout.
                  {couponInfo.partnerName && <> — Coupon by <strong>{couponInfo.partnerName}</strong></>}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
