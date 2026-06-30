import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the "Rendering..." dev indicator. Every router dispatch (including
  // <Link> prefetches) is wrapped in startTransition by Next.js 16. The dynamic
  // admin routes (Supabase auth reads request-time cookies) keep isPending=true
  // until all prefetches for the 10+ sidebar links settle, so the badge never
  // clears. This flag is dev-only — no production effect.
  devIndicators: false,
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
