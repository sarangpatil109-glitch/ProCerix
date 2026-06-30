"use client";

import { useEffect } from "react";
import { analyticsServerError } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    analyticsServerError(500, error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-9xl font-black text-gray-900 dark:text-white leading-none">500</p>
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Something went wrong</h1>
        <p className="text-gray-500 dark:text-gray-400">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
