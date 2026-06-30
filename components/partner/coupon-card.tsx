"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, Link2, Tag, CheckCircle2, TrendingUp, ShoppingBag, Zap } from "lucide-react";

interface CouponCardProps {
  partner: {
    full_name: string;
    referral_code: string;
    discount_type: string;
    discount_value: number;
    commission_percentage?: number;
    commission_rate?: number;
    status: string;
  };
  totalSales: number;
  totalEarned: number;
}

function trackEvent(code: string, event: string) {
  fetch("/api/partner/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, event }),
  }).catch(() => {});
}

export function CouponCard({ partner, totalSales, totalEarned }: CouponCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = "https://procerix.com";
  const promotionLink = `${baseUrl}?coupon=${partner.referral_code}`;
  const commission = partner.commission_percentage ?? partner.commission_rate ?? 50;
  const discountLabel = partner.discount_type === "flat"
    ? `₹${partner.discount_value} Flat`
    : `${partner.discount_value}% Off`;

  const whatsappMessage =
    `🎓 Get Premium Certificates & Internships from ProCerix!\n\n` +
    `🎁 Use my exclusive coupon code:\n\n` +
    `${partner.referral_code}\n\n` +
    `✅ Instant Discount\n` +
    `✅ Verifiable Certificate\n` +
    `✅ Industry-ready Internships\n\n` +
    `🌐 ${baseUrl}\n\n` +
    `Hurry! 🚀`;

  const promotionMessage =
    `Use coupon *${partner.referral_code}* on ProCerix for exclusive discounts on certificates & internships!\n${promotionLink}`;

  const copy = async (text: string, label: string, eventName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied!`);
      trackEvent(partner.referral_code, eventName);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Copy failed — try manually");
    }
  };

  const shareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
    trackEvent(partner.referral_code, "whatsapp_share");
  };

  const copyPromotionLink = () =>
    copy(promotionLink, "Promotion link", "copy_link");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-px shadow-2xl shadow-blue-500/20">
      {/* Glow border */}
      <div className="relative rounded-3xl bg-white dark:bg-gray-900 p-6 md:p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">My Coupon</p>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Promotion Center</h3>
            <p className="text-sm text-gray-500 mt-0.5">Share your code. Earn every time.</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            partner.status === "approved"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}>
            {partner.status}
          </div>
        </div>

        {/* Coupon code display */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Coupon Code</span>
            </div>
            <button
              onClick={() => copy(partner.referral_code, "Coupon code", "copy_coupon")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
            >
              {copied === "Coupon code" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "Coupon code" ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="font-mono text-4xl font-black text-blue-700 dark:text-blue-300 tracking-[0.2em]">
            {partner.referral_code}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Discount", value: discountLabel, icon: Zap, color: "text-orange-500" },
            { label: "Commission", value: `${commission}%`, icon: TrendingUp, color: "text-green-500" },
            { label: "Total Sales", value: String(totalSales), icon: ShoppingBag, color: "text-blue-500" },
            { label: "Total Earned", value: `₹${totalEarned.toFixed(0)}`, icon: CheckCircle2, color: "text-purple-500" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-3 text-center">
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1.5`} />
              <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Primary actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <MessageCircle className="w-5 h-5" />
            Share on WhatsApp
          </button>
          <button
            onClick={copyPromotionLink}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <Link2 className="w-5 h-5" />
            {copied === "Promotion link" ? "Copied!" : "Copy Promotion Link"}
          </button>
        </div>

        {/* Secondary copy actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Copy Coupon", text: partner.referral_code, event: "copy_coupon_secondary", icon: Tag },
            { label: "Copy Message", text: promotionMessage, event: "copy_message", icon: Copy },
            { label: "Copy Link", text: promotionLink, event: "copy_link_secondary", icon: Link2 },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => copy(a.text, a.label, a.event)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium transition-colors"
            >
              {copied === a.label ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <a.icon className="w-4 h-4" />}
              {copied === a.label ? "Copied!" : a.label}
            </button>
          ))}
        </div>

        {/* Promotion link preview */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 font-mono truncate flex-1">{promotionLink}</p>
          <button onClick={copyPromotionLink} className="shrink-0 text-blue-500 hover:text-blue-700 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
