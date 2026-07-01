"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu, X, Star, ChevronRight, LogOut,
  LayoutDashboard, Tag, ShoppingBag, TrendingUp,
  Wallet, User, Home, BookOpen, Briefcase, FileText,
  Link2, DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const PUBLIC_NAV = [
  { href: "/",                   label: "Home",               icon: Home },
  { href: "/certificates",       label: "Certificates",       icon: BookOpen },
  { href: "/internships",        label: "Virtual Internships", icon: Briefcase },
  { href: "/resume-builder",     label: "Resume Builder",     icon: FileText },
  { href: "/linkedin-optimizer", label: "LinkedIn Optimizer", icon: Link2 },
  { href: "/pricing",            label: "Pricing",            icon: DollarSign },
];

const ACCOUNT_NAV = [
  { href: "/dashboard",                        label: "Dashboard",           icon: LayoutDashboard },
  { href: "/affiliate/dashboard",              label: "Affiliate Dashboard", icon: Star, star: true },
  { href: "/affiliate/dashboard/coupon",       label: "My Coupon",           icon: Tag },
  { href: "/affiliate/dashboard/sales",        label: "Sales",               icon: ShoppingBag },
  { href: "/affiliate/dashboard/commission",   label: "Commission",          icon: TrendingUp },
  { href: "/affiliate/dashboard/withdraw",     label: "Withdraw",            icon: Wallet },
  { href: "/dashboard/settings",               label: "Profile",             icon: User },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Close on ESC
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drawerOpen, closeDrawer]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    closeDrawer();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="lg:hidden">
      {/* ── Mobile sticky header bar ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4
        bg-white/95 dark:bg-gray-950/95 backdrop-blur-md
        border-b border-gray-200/60 dark:border-gray-800/60 shadow-sm">

        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 -ml-1 rounded-xl text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo — absolutely centered */}
        <Link
          href="/"
          onClick={closeDrawer}
          className="absolute left-1/2 -translate-x-1/2 text-xl font-black
            text-blue-600 dark:text-blue-500 tracking-tighter whitespace-nowrap"
        >
          ProCerix
        </Link>

        {/* Right action */}
        <div className="ml-auto shrink-0">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold
                bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            >
              Dashboard <ChevronRight className="w-3 h-3" />
            </Link>
          ) : (
            <Link
              href="/signup"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold
                bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
                text-white dark:text-gray-900 rounded-full transition-colors"
            >
              Sign Up
            </Link>
          )}
        </div>
      </header>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <aside
        aria-label="Site navigation"
        className={`fixed inset-y-0 left-0 z-[1001] w-[280px] flex flex-col
          bg-white dark:bg-gray-900 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link
            href="/"
            onClick={closeDrawer}
            className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tighter flex-1"
          >
            ProCerix
          </Link>
          <button
            onClick={closeDrawer}
            aria-label="Close navigation"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

          {/* Public pages */}
          {PUBLIC_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={closeDrawer}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800
                hover:text-gray-900 dark:hover:text-white
                transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0 text-gray-400" />
              {label}
            </Link>
          ))}

          {/* Affiliate — highlighted */}
          <Link
            href="/affiliate"
            onClick={closeDrawer}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
              text-amber-600 dark:text-amber-400
              hover:bg-amber-50 dark:hover:bg-amber-900/20
              transition-colors"
          >
            <Star className="w-4 h-4 shrink-0 fill-amber-500 text-amber-500" />
            Affiliate
          </Link>

          {/* Account section — only when logged in */}
          {isLoggedIn && (
            <>
              <div className="my-2 mx-1 border-t border-gray-100 dark:border-gray-800" />
              <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                My Account
              </p>
              {ACCOUNT_NAV.map(({ href, label, icon: Icon, star }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeDrawer}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-colors ${
                      star
                        ? "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${star ? "text-blue-500" : "text-gray-400"}`} />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2 shrink-0">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-gray-600 dark:text-gray-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                hover:text-red-600 dark:hover:text-red-400
                transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeDrawer}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold
                  border border-gray-200 dark:border-gray-700
                  text-gray-900 dark:text-white
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={closeDrawer}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold
                  bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
