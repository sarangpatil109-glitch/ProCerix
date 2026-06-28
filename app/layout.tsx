
import type { Metadata } from "next";
import { fontSans, fontHeading } from "./fonts";
import { GlobalProvider } from "@/providers/global-provider";
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
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: siteName,
      description: siteDesc,
      url: baseUrl,
      siteName,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDesc,
      images: ["/og-image.jpg"],
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
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
