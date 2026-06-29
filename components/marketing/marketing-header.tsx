import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function MarketingHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link prefetch={false} href="/" className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">
          ProCerix
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
          <Link prefetch={false} href="/certificates" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Certificates</Link>
          <Link prefetch={false} href="/internships" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Virtual Internships</Link>
          <Link prefetch={false} href="/resume-builder" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Resume Builder</Link>
          <Link prefetch={false} href="/linkedin-optimizer" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">LinkedIn Optimizer</Link>
          <Link prefetch={false} href="/pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Pricing</Link>
          <Link prefetch={false} href="/search" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-1">
            <Search className="w-4 h-4" /> Search
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-lg shadow-blue-500/20 text-sm"
            >
              Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link prefetch={false} href="/login" className="hidden md:block text-gray-900 dark:text-white font-bold text-sm hover:underline">
                Log In
              </Link>
              <Link 
                href="/signup"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-full transition-colors text-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
