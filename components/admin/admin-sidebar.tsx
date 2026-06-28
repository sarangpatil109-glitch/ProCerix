"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Layers, FileText, HelpCircle, Briefcase, Tag } from "lucide-react";

const menuItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Courses", href: "/admin/courses", icon: BookOpen },
  { title: "Modules", href: "/admin/modules", icon: Layers },
  { title: "Lessons", href: "/admin/lessons", icon: FileText },
  { title: "Quizzes", href: "/admin/quizzes", icon: HelpCircle },
  { title: "Internships", href: "/admin/internships", icon: Briefcase },
  { title: "Skills", href: "/admin/skills", icon: Tag },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">
          ProCerix<span className="text-gray-900 dark:text-white text-sm font-bold ml-2 uppercase">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
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
    </div>
  );
}
