import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center space-y-6 shadow-2xl shadow-gray-200/50 dark:shadow-none transition-all">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-900/10">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Payment Error</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          We encountered an error while processing your payment verification. Our support team has been notified.
        </p>
        <div className="pt-4">
          <Link href="/search" className="block w-full py-4 px-6 bg-gray-900 dark:bg-gray-800 text-white rounded-full font-bold text-lg transition-all hover:bg-gray-800 dark:hover:bg-gray-700">
            Return to Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
