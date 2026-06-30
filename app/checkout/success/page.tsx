import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PixelFirePurchase } from "@/components/meta-pixel/PixelFirePurchase";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center p-4 selection:bg-blue-500/30">
      <Suspense fallback={null}>
        <PixelFirePurchase />
      </Suspense>
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center space-y-6 shadow-2xl shadow-gray-200/50 dark:shadow-none transition-all">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50 dark:ring-green-900/10">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Payment Successful</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Your payment has been verified. You now have access to your course. If your course is virtual, it is currently generating in the background.
        </p>
        <div className="pt-4">
          <Link href="/dashboard" className="block w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
