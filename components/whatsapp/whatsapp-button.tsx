"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { WHATSAPP_NUMBER } from "@/constants";

// ─── Pages where the button is hidden ────────────────────────────────────────

const HIDDEN_PREFIXES = [
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/admin",
];

// ─── Smart context: map pathname → human-readable label ──────────────────────

function formatSlug(raw: string): string {
  return decodeURIComponent(raw)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getPageContext(pathname: string): string | null {
  // Learn / quiz pages
  if (pathname.startsWith("/learn/")) {
    const slug = pathname.split("/learn/")[1]?.split("/")[0] ?? "";
    return slug ? `${formatSlug(slug)} (Course)` : "Learning Page";
  }

  // Certificate detail / verify
  if (pathname.match(/^\/certificate\/[^/]+/)) {
    const slug = pathname.split("/certificate/")[1]?.split("/")[0] ?? "";
    return slug ? `${formatSlug(slug)} Certificate` : "Certificate";
  }
  if (pathname.startsWith("/verify")) return "Certificate Verification";

  // Internship detail
  if (pathname.match(/^\/internships?\/[^/]+/)) {
    const slug = pathname.split(/\/internships?\//)[1]?.split("/")[0] ?? "";
    return slug ? `${formatSlug(slug)} Internship` : "Internship";
  }

  // Course / product detail
  if (pathname.match(/^\/courses?\/[^/]+/)) {
    const slug = pathname.split(/\/courses?\//)[1]?.split("/")[0] ?? "";
    return slug ? formatSlug(slug) : "Course";
  }

  // Affiliate subsections
  if (pathname.startsWith("/affiliate/dashboard")) {
    const sub = pathname.replace(/^\/affiliate\/dashboard\/?/, "").split("/")[0];
    return sub ? `Affiliate ${formatSlug(sub)}` : "Affiliate Dashboard";
  }

  // Dashboard subsections
  if (pathname.startsWith("/dashboard")) {
    const sub = pathname.replace(/^\/dashboard\/?/, "").split("/")[0];
    return sub ? `Dashboard · ${formatSlug(sub)}` : "Dashboard";
  }

  // Checkout
  if (pathname.startsWith("/checkout")) return "Checkout";

  // Named static pages
  const staticLabels: Record<string, string> = {
    "/faq":           "FAQ",
    "/contact":       "Contact",
    "/about":         "About",
    "/privacy":       "Privacy Policy",
    "/terms":         "Terms & Conditions",
    "/refund-policy": "Refund Policy",
    "/support":       "Support",
    "/pricing":       "Pricing",
    "/search":        "Search",
  };
  if (staticLabels[pathname]) return staticLabels[pathname];

  return null;
}

// ─── WhatsApp SVG (official logo) ─────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsAppButton() {
  const pathname = usePathname();
  const [pulse, setPulse] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade in after a short delay so it doesn't flash on every navigation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Start pulse ring after 20 s of first mount
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 20_000);
    return () => clearTimeout(t);
  }, []);

  // Hide on auth / admin pages
  const isHidden = HIDDEN_PREFIXES.some(
    p => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"),
  );
  if (isHidden) return null;

  const context = getPageContext(pathname);
  const message = [
    "Hello ProCerix Team,",
    "",
    "I need help regarding:",
    "",
    "_____________________",
    ...(context ? ["", `Current Page: ${context}`] : []),
  ].join("\n");

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className={`fixed right-6 z-[9999] transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ bottom: "max(1.5rem, calc(1rem + env(safe-area-inset-bottom)))" }}
    >
      {/* Tooltip + button wrapper */}
      <div className="relative flex flex-col items-end gap-0 group">

        {/* Tooltip — slides up from button on hover */}
        <div
          aria-hidden="true"
          className="absolute bottom-full right-0 mb-3 pointer-events-none
            opacity-0 translate-y-1 scale-95
            group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
            transition-all duration-200 ease-out"
        >
          <div className="relative bg-gray-900 dark:bg-gray-800 text-white rounded-2xl px-4 py-2.5 shadow-xl shadow-black/20 whitespace-nowrap text-right">
            <p className="text-sm font-semibold leading-tight">Need Help?</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Chat on WhatsApp</p>
            {/* Arrow pointing down */}
            <span className="absolute top-full right-5 -mt-px border-[6px] border-transparent border-t-gray-900 dark:border-t-gray-800" />
          </div>
        </div>

        {/* Button */}
        <div className="relative">
          {/* Pulse ring — shown after 20 s, stops on hover */}
          {pulse && (
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-50 group-hover:opacity-0 transition-opacity" />
          )}

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp — Need help?"
            className="
              relative flex items-center justify-center
              w-14 h-14 rounded-full
              bg-[#25D366] hover:bg-[#20c55d] active:bg-[#1daf53]
              text-white
              shadow-[0_4px_24px_rgba(37,211,102,0.45)]
              hover:shadow-[0_8px_32px_rgba(37,211,102,0.6)]
              hover:scale-110 active:scale-95
              transition-all duration-300 ease-out
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/50
            "
          >
            <WhatsAppIcon className="w-7 h-7" />
          </a>
        </div>
      </div>
    </div>
  );
}
