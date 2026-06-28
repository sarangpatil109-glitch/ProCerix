"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Award, Briefcase, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const bottomItems = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ accessibleProducts = [] }: { accessibleProducts?: any[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const dynamicMenuItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...accessibleProducts.map(p => ({
      title: `My ${p.name}`,
      href: p.routes.dashboard,
      icon: p.icon
    }))
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 flex flex-col z-10">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">
          ProCerix
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {dynamicMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 space-y-1 border-t border-gray-200 dark:border-gray-800">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
