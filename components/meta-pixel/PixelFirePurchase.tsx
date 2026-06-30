"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { purchase } from "@/lib/meta-pixel";
import { analyticsPurchase } from "@/lib/analytics";
import { trackEvent, upgradeSession } from "@/lib/clarity";

export function PixelFirePurchase() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const value = Number(searchParams.get("amount") ?? searchParams.get("value") ?? 0);
    const content_name = searchParams.get("course") ?? searchParams.get("slug") ?? undefined;
    const transaction_id = searchParams.get("order_id") ?? searchParams.get("txn") ?? undefined;
    const contentType = searchParams.get("type") ?? "course";

    purchase({
      value,
      currency: "INR",
      ...(content_name ? { content_name } : {}),
    });

    analyticsPurchase({
      transaction_id,
      value,
      currency: "INR",
      item_name: content_name,
    });

    trackEvent("purchase");
    upgradeSession(contentType === "internship" ? "Purchased Internship" : "Purchased Course");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
