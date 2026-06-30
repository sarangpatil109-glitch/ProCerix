"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { pageView } from "@/lib/analytics";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-M9SDJFBB";

const GTM_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

function RouteTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    pageView(pathname);
  }, [pathname]);

  return null;
}

function ScrollDepthTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= 0.9) {
        fired = true;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "scroll_depth", scroll_percent: 90, page_path: pathname });
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}

function TimeOnPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "time_on_page", seconds: 30, page_path: pathname });
    }, 30000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

export function GTMInit() {
  return (
    <>
      <Script
        id="gtm-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: GTM_SCRIPT }}
      />
      <Suspense fallback={null}>
        <RouteTracker />
        <ScrollDepthTracker />
        <TimeOnPageTracker />
      </Suspense>
    </>
  );
}
