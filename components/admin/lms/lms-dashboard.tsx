"use client";

import Link from "next/link";
import {
  BookOpen, Award, Briefcase, Globe, FileEdit, Tags, Image, Layout,
  PlusCircle, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle,
  BarChart2, ChevronRight, Clock
} from "lucide-react";

interface Props {
  stats: {
    total: number;
    certificates: number;
    internships: number;
    published: number;
    draft: number;
    totalStudents: number;
    totalRevenue: number;
  };
  recentProducts: any[];
  auditIssues: any[];
}

export function LmsDashboard({ stats, recentProducts, auditIssues }: Props) {
  const STAT_CARDS = [
    { label: "Total Products", value: stats.total, icon: BookOpen, color: "blue" },
    { label: "Certificates", value: stats.certificates, icon: Award, color: "amber" },
    { label: "Internships", value: stats.internships, icon: Briefcase, color: "purple" },
    { label: "Published", value: stats.published, icon: Globe, color: "emerald" },
    { label: "Drafts", value: stats.draft, icon: FileEdit, color: "gray" },
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "sky" },
  ];

  const QUICK_LINKS = [
    { label: "Products", href: "/admin/lms/products", icon: BookOpen, desc: "Manage all products" },
    { label: "Categories", href: "/admin/lms/categories", icon: Tags, desc: "Organize by category" },
    { label: "Media Library", href: "/admin/lms/media", icon: Image, desc: "Images, PDFs, icons" },
    { label: "Templates", href: "/admin/lms/templates", icon: Layout, desc: "Letter & cert templates" },
    { label: "Drafts", href: "/admin/lms/drafts", icon: FileEdit, desc: "Unpublished products" },
    { label: "Published", href: "/admin/lms/published", icon: Globe, desc: "Live products" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    gray: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    sky: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">LMS Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your learning products</p>
        </div>
        <Link
          href="/admin/lms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
            >
              <l.icon className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{l.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Recent Products</h2>
            <Link href="/admin/lms/products" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentProducts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BookOpen className="w-8 h-8 mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400">No products yet</p>
                <Link href="/admin/lms/new" className="text-xs text-blue-600 mt-1 inline-block">Create your first product →</Link>
              </div>
            ) : recentProducts.map((p: any) => (
              <Link key={p.id} href={`/admin/lms/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.course_type === "certificates" || p.course_type === "certificate" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-purple-50 dark:bg-purple-900/20"}`}>
                  {p.course_type === "certificates" || p.course_type === "certificate"
                    ? <Award className="w-4 h-4 text-amber-500" />
                    : <Briefcase className="w-4 h-4 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                      {p.is_published ? "Live" : "Draft"}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{new Date(p.updated_at || p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Audit Issues */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Content Issues</h2>
            <Link href="/admin/lms/audit" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              Full audit <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {auditIssues.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-gray-400">All products pass audit</p>
              </div>
            ) : auditIssues.map((issue: any) => (
              <Link key={issue.id} href={`/admin/lms/${issue.id}?tab=audit`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{issue.title}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{issue.reason}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
