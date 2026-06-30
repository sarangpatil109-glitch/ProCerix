"use client";

import { useRouter } from "next/navigation";
import { lead, initiateCheckout } from "@/lib/meta-pixel";
import { analyticsBeginCheckout } from "@/lib/analytics";
import { trackEvent } from "@/lib/clarity";

export function InternshipEnrollButton({
  slug,
  price,
  label,
}: {
  slug: string;
  price: number;
  label: string;
}) {
  const router = useRouter();

  const handleClick = () => {
    lead({ content_name: "Internship Application" });
    initiateCheckout({ value: price, currency: "INR" });
    analyticsBeginCheckout({ value: price, currency: "INR", item_name: slug });
    trackEvent("checkout");
    router.push(`/checkout?type=internship&slug=${slug}`);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
    >
      {label}
    </button>
  );
}
