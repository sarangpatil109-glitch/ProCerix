"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Tag, ShoppingBag, TrendingUp, Wallet,
  Megaphone, BookOpen, User, LogOut, Star, Banknote, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { title: "Overview",      href: "/affiliate/dashboard",               icon: LayoutDashboard, exact: true },
  { title: "My Coupon",     href: "/affiliate/dashboard/coupon",        icon: Tag },
  { title: "Promotion",     href: "/affiliate/dashboard/promotion",     icon: Megaphone },
  { title: "Sales",         href: "/affiliate/dashboard/sales",         icon: ShoppingBag },
  { title: "Commission",    href: "/affiliate/dashboard/commission",    icon: TrendingUp },
  { title: "Payouts",       href: "/affiliate/dashboard/payouts",       icon: Banknote },
  { title: "Withdraw",      href: "/affiliate/dashboard/withdraw",      icon: Wallet },
  { title: "Marketing Kit", href: "/affiliate/dashboard/marketing-kit", icon: BookOpen },
  { title: "Profile",       href: "/affiliate/dashboard/profile",       icon: User },
];

interface AffiliateSidebarProps {
  name: string;
  coupon: string;
  /** Called after each nav link click (used by mobile drawer to close itself) */
  onNavClick?: () => void;
  /** Show an X close button in the header (mobile drawer only) */
  onClose?: () => void;
}

export function AffiliateSidebar({ name, coupon, onNavClick, onClose }: AffiliateSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="w-[240px] shrink-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">

      {/* Brand header */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-gray-800 gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Affiliate Hub</p>
          <p className="text-xs text-gray-400 font-mono truncate">{coupon}</p>
        </div>
        {/* Close button — only rendered in mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1 shrink-0">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{name}</p>
          <p className="text-xs text-gray-400">Affiliate</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
