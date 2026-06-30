"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, CheckCircle2 } from "lucide-react";

interface Props {
  coupon: string;
  name: string;
  discountLabel: string;
}

export function AffiliateMarketingKit({ coupon, name, discountLabel }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = "https://procerix.com";
  const promoLink = `${baseUrl}?coupon=${coupon}`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch { toast.error("Copy failed"); }
  };

  const templates = [
    {
      title: "WhatsApp Message",
      key: "wa",
      text: `🎓 Get Premium Certificates & Internships from ProCerix!\n\n🎁 Use my coupon:\n\n${coupon}\n\n✅ Instant Discount\n✅ Verifiable Certificate\n✅ Industry-ready Internships\n\n🌐 ${baseUrl}?coupon=${coupon}\n\nHurry! 🚀`,
    },
    {
      title: "Short Promo Message",
      key: "short",
      text: `Use coupon *${coupon}* on ProCerix for ${discountLabel} on certificates & internships! 🎓\n${promoLink}`,
    },
    {
      title: "Instagram Bio",
      key: "insta",
      text: `🎓 Helping you get certified & job-ready\n💼 Use my code ${coupon} on ProCerix\n🔗 ${promoLink}`,
    },
    {
      title: "Email Subject",
      key: "emailsub",
      text: `Get ${discountLabel} on ProCerix Certificates — Use Code ${coupon}`,
    },
    {
      title: "Email Body",
      key: "emailbody",
      text: `Hi,\n\nI wanted to share an amazing platform for online certificates and internships — ProCerix!\n\nUse my exclusive coupon code ${coupon} to get ${discountLabel} instantly.\n\n👉 ${promoLink}\n\nProCerix offers AI-powered certificates, virtual internships, and much more. Completely online and verified.\n\nEnroll now → ${promoLink}\n\n${name}`,
    },
    {
      title: "Tweet / X Post",
      key: "tweet",
      text: `🎓 Get certified from home! Use my code ${coupon} on @ProCerix for ${discountLabel} on premium certificates & internships. 🚀\n\n${promoLink}\n\n#OnlineCertificate #CareerGrowth #ProCerix`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map(t => (
        <div key={t.key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t.title}</h3>
            <button
              onClick={() => copy(t.text, t.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
            >
              {copied === t.key ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === t.key ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-xl p-3 max-h-40 overflow-y-auto">{t.text}</pre>
        </div>
      ))}
    </div>
  );
}
