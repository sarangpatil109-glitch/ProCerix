"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, Star } from "lucide-react";
import { AffiliateSidebar } from "@/components/affiliate/affiliate-sidebar";

interface Props {
  name: string;
  coupon: string;
  children: React.ReactNode;
}

export function AffiliateDashboardShell({ name, coupon, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer  = () => setDrawerOpen(true);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Close on ESC key
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drawerOpen, closeDrawer]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">

      {/* ── Desktop sidebar: visible from lg upward ── */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen">
        <AffiliateSidebar name={name} coupon={coupon} />
      </aside>

      {/* ── Mobile overlay: dims content behind drawer ── */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Mobile drawer: slides in from the left ── */}
      <aside
        aria-label="Navigation drawer"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-[240px] shadow-2xl
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <AffiliateSidebar
          name={name}
          coupon={coupon}
          onNavClick={closeDrawer}
          onClose={closeDrawer}
        />
      </aside>

      {/* ── Main column (header + content) ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile-only top header with hamburger */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <button
            onClick={openDrawer}
            aria-label="Open navigation menu"
            className="p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand mark */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Affiliate Hub</span>
          </div>

          {/* Coupon chip */}
          <span className="ml-auto text-xs font-mono text-gray-400 truncate max-w-[120px]">
            {coupon}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
