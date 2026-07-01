"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Layers, FileText, HelpCircle, Briefcase, Tag,
  Settings, Home, Image as ImageIcon, Ticket, Award, Users, BarChart, LogOut, Handshake, Star
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const topMenuItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart },
];

const contentMenuItems = [
  { title: "Courses", href: "/admin/courses", icon: BookOpen },
  { title: "Internships", href: "/admin/internships", icon: Briefcase },
  { title: "Blog", href: "/admin/blog", icon: FileText },
  { title: "Certificates", href: "/admin/certificates/settings", icon: Award },
];

const commerceMenuItems = [
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Coupons", href: "/admin/coupons", icon: Ticket },
  { title: "Partners", href: "/admin/partners", icon: Handshake },
];

const affiliateMenuItems = [
  { title: "Applications", href: "/admin/affiliates", icon: Users },
  { title: "Affiliates", href: "/admin/affiliates/profiles", icon: Star },
  { title: "Affiliate Sales", href: "/admin/affiliates/sales", icon: BarChart },
  { title: "Weekly Payouts", href: "/admin/affiliates/weekly-payouts", icon: Handshake },
  { title: "Withdrawals", href: "/admin/affiliates/withdrawals", icon: Ticket },
  { title: "Settings", href: "/admin/affiliates/settings", icon: Settings },
];

const siteMenuItems = [
  { title: "Site Settings", href: "/admin/settings", icon: Settings },
  { title: "Homepage CMS", href: "/admin/homepage", icon: Home },
  { title: "Banners", href: "/admin/banners", icon: ImageIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const NavItem = ({ item }: { item: { title: string, href: string, icon: any } }) => {
    // Exact match for dashboard, prefix match for others to keep active state when editing
    const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
    
    return (
      <Link
        href={item.href}
        prefetch={false}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
          isActive 
            ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" 
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
      >
        <item.icon className={`w-4 h-4 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`} />
        {item.title}
      </Link>
    );
  };

  return (
    <div className="w-[260px] h-full bg-[#F7F7F8] dark:bg-[#0E0E0E] border-r border-gray-200 dark:border-gray-800/60 shrink-0 flex flex-col font-sans">
      <div className="h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-800/60 shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-xs">P</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight group-hover:opacity-80 transition-opacity">ProCerix Workspace</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
        <div className="space-y-1">
          {topMenuItems.map(item => <NavItem key={item.href} item={item} />)}
        </div>

        <div>
          <h4 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Content</h4>
          <div className="space-y-1">
            {contentMenuItems.map(item => <NavItem key={item.href} item={item} />)}
          </div>
        </div>

        <div>
          <h4 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Commerce</h4>
          <div className="space-y-1">
            {commerceMenuItems.map(item => <NavItem key={item.href} item={item} />)}
          </div>
        </div>

        <div>
          <h4 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Affiliate Management</h4>
          <div className="space-y-1">
            {affiliateMenuItems.map(item => <NavItem key={item.href} item={item} />)}
          </div>
        </div>

        <div>
          <h4 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Platform</h4>
          <div className="space-y-1">
            {siteMenuItems.map(item => <NavItem key={item.href} item={item} />)}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 shrink-0">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4 text-gray-500" />
          Sign out
        </button>
      </div>
    </div>
  );
}
