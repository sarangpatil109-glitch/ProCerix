"use client";

import React from "react";
import Link from "next/link";
import { lead } from "@/lib/meta-pixel";
import { analyticsGenerateLead } from "@/lib/analytics";
import { trackEvent } from "@/lib/clarity";

export function FloatingWhatsApp() {
  const message = "Hello ProCerix Team, I want to know more about your courses.";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/917559368068?text=${encodedMessage}`;

  return (
    <>
      <style>{`
        @keyframes whatsapp-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
          5% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(37, 211, 102, 0); }
          10% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        .whatsapp-pulse {
          animation: whatsapp-pulse 8s infinite;
        }
      `}</style>
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with ProCerix on WhatsApp"
        onClick={() => { lead({ content_name: "WhatsApp Support" }); analyticsGenerateLead("WhatsApp"); trackEvent("whatsapp_click"); }}
        className="group fixed z-[9999] right-4 bottom-4 md:right-6 md:bottom-6 w-[58px] h-[58px] md:w-16 md:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:scale-[1.08] transition-transform duration-300 whatsapp-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-[#25D366]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="currentColor"
          className="w-8 h-8 md:w-9 md:h-9"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>

        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold px-4 py-2 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block whitespace-nowrap">
          Chat with us
          {/* Tooltip triangle */}
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-t border-zinc-200 dark:border-zinc-700 rotate-45"></div>
        </div>
      </Link>
    </>
  );
}
