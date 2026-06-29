"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Briefcase, FileText, UserCircle, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProductRegistry } from "@/engines/registry/product-registry";
import { useState } from "react";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Briefcase,
  FileText,
  UserCircle,
  Users,
};

const bottomItems = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const products = ProductRegistry.getAllProducts();
  const dynamicMenuItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...products.map(p => ({
      title: `My ${p.name.replace("AI ", "")}`, // Clean title
      href: p.routes.dashboard,
      icon: ICON_MAP[p.iconName] ?? BookOpen,
    }))
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 w-full fixed top-0 left-0 z-40 shadow-sm">
        <Link href="/" className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">
          ProCerix
        </Link>
        <button onClick={() => setIsOpen(true)} aria-label="Open Menu" className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar (Drawer on Mobile, Permanent on Desktop/Tablet) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] md:w-[240px] bg-white dark:bg-gray-900 md:border-r border-gray-200 dark:border-gray-800 shrink-0 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 ${
        isOpen ? "translate-x-0 rounded-r-2xl md:rounded-none shadow-2xl md:shadow-none" : "-translate-x-full shadow-none"
      }`}>
        <div className="h-16 md:h-auto p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <Link prefetch={false} href="/" onClick={closeDrawer} className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter hidden md:block">
            ProCerix
          </Link>
          <span className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tighter md:hidden block">Menu</span>
          <button onClick={closeDrawer} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          {dynamicMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3 md:p-4 space-y-1 border-t border-gray-200 dark:border-gray-800 shrink-0">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.title}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
