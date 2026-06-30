"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Wallet, LogOut, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { title: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { title: "Purchases", href: "/partner/dashboard/purchases", icon: ShoppingBag },
  { title: "Withdrawals", href: "/partner/dashboard/withdrawals", icon: Wallet },
];

export function PartnerSidebar({ partnerName, referralCode }: { partnerName: string; referralCode: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : "https://procerix.com"}/?ref=${referralCode}`;

  return (
    <div className="w-[260px] h-full bg-[#F7F7F8] dark:bg-[#0E0E0E] border-r border-gray-200 dark:border-gray-800/60 shrink-0 flex flex-col">
      <div className="h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-800/60">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-xs">P</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Partner Portal</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/partner/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* Referral link */}
        <div className="px-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Referral Code</p>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 space-y-2">
            <div className="text-lg font-black text-blue-600 tracking-widest">{referralCode}</div>
            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Copy referral link
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800/60">
        <p className="text-xs text-gray-500 px-3 mb-2 truncate">{partnerName}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
