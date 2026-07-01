import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const returnToParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ProCerix
            </span>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">Career Acceleration Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-gray-200/80 dark:shadow-black/60 border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Card header */}
          <div className="px-8 pt-8 pb-0 sm:px-10 sm:pt-10">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Create New Account
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Join thousands of learners on ProCerix
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8 sm:px-10">
            <SignupForm />
          </div>

          {/* Divider + login CTA */}
          <div className="px-8 pb-8 sm:px-10 sm:pb-10 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white dark:bg-gray-900 text-xs text-gray-400 dark:text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link
              href={`/login${returnToParam}`}
              className="w-full h-12 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-sm flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              Login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Secured with industry-standard encryption · &copy; {new Date().getFullYear()} ProCerix
        </p>
      </div>
    </div>
  );
}
