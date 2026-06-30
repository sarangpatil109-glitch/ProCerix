
import type { Metadata } from "next";
import { fontSans, fontHeading } from "./fonts";
import { GlobalProvider } from "@/providers/global-provider";
import { MetaPixelInit } from "@/components/meta-pixel/MetaPixelInit";
import { GTMInit } from "@/components/gtm/GTMInit";
import { ClarityInit } from "@/components/clarity/ClarityInit";
import { Suspense } from "react";
import { ReferralTracker } from "@/components/partner/referral-tracker";
import { CouponBanner } from "@/components/partner/coupon-banner";
import { APP_CONFIG } from "@/constants";
import { SettingsService } from "@/services/settings-service";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await SettingsService.getAllSettings();
  const siteName = settings.platform_name || APP_CONFIG.name;
  const siteDesc = settings.platform_tagline || APP_CONFIG.description;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDesc,
    metadataBase: new URL(baseUrl),
    keywords: [
      "online certification",
      "AI certification",
      "virtual internship",
      "skill certificate",
      "online courses",
      "ProCerix",
      "verifiable certificate",
    ],
    icons: {
      icon: "/branding/logo.png",
      shortcut: "/branding/logo.png",
      apple: "/branding/logo.png",
    },
    openGraph: {
      title: siteName,
      description: siteDesc,
      url: baseUrl,
      siteName,
      images: [
        {
          url: "/branding/logo.png",
          width: 1200,
          height: 630,
          alt: `${siteName} — AI Certification Platform`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDesc,
      images: ["/branding/logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}>
        {/* GTM noscript fallback */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-M9SDJFBB"}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Meta Pixel noscript fallback */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <noscript><img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1043828034994970"}&ev=PageView&noscript=1`} alt="" /></noscript>
        <GTMInit />
        <MetaPixelInit />
        <ClarityInit />
        <Suspense fallback={null}><ReferralTracker /></Suspense>
        <Suspense fallback={null}><CouponBanner /></Suspense>
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
