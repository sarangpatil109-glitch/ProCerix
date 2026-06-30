"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analyticsPageNotFound } from "@/lib/analytics";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    analyticsPageNotFound(pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-9xl font-black text-gray-900 dark:text-white leading-none">404</p>
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
