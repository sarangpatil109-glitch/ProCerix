"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen, Briefcase, Search, Pencil, Trash2, Copy, Globe, EyeOff,
  Layers, FileText, ClipboardList, Star,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  course_type: string;
  is_published: boolean;
  is_featured: boolean;
  price: number;
  original_price: number;
  category: string;
  difficulty: string;
  thumbnail_url: string | null;
  modules: number;
  lessons: number;
  mcqs: number;
}

export function LmsProductList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "certificates" | "internship">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || p.course_type === typeFilter;
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "published" ? p.is_published : !p.is_published);
      return matchSearch && matchType && matchStatus;
    });
  }, [products, search, typeFilter, statusFilter]);

  const call = async (action: string, id: string, extra?: Record<string, unknown>) => {
    setLoading(`${action}-${id}`);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handlePublish = (p: Product) =>
    call("PUBLISH_COURSE", p.id, { is_published: !p.is_published }).then(() =>
      toast.success(p.is_published ? "Moved to Draft" : "Published!")
    );

  const handleDuplicate = (p: Product) =>
    call("DUPLICATE_COURSE", p.id).then(() => toast.success("Duplicated!"));

  const handleDelete = (p: Product) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    call("DELETE_COURSE", p.id).then(() => toast.success("Deleted"));
  };

  const certCount = products.filter((p) => p.course_type === "certificates" || p.course_type === "certificate").length;
  const internCount = products.filter((p) => p.course_type === "internship").length;
  const publishedCount = products.filter((p) => p.is_published).length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, color: "text-gray-900 dark:text-white" },
          { label: "Certificates", value: certCount, color: "text-blue-600 dark:text-blue-400" },
          { label: "Internships", value: internCount, color: "text-purple-600 dark:text-purple-400" },
          { label: "Published", value: publishedCount, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="certificates">Certificates</option>
          <option value="internship">Internships</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="font-semibold text-gray-500">No products found</p>
          <Link href="/admin/lms/new" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
            + Create your first product
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => {
            const isCert = p.course_type === "certificates" || p.course_type === "certificate";
            const isLoading = (a: string) => loading === `${a}-${p.id}`;
            return (
              <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                {/* Type icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCert ? "bg-blue-50 dark:bg-blue-900/20" : "bg-purple-50 dark:bg-purple-900/20"}`}>
                  {isCert
                    ? <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    : <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{p.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCert ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                      {isCert ? "Certificate" : "Internship"}
                    </span>
                    {p.is_published
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Published</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Draft</span>}
                    {p.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{p.category || "No category"} · ₹{p.price}</p>
                  {/* Counts */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Layers className="w-3.5 h-3.5" />{p.modules} modules
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <FileText className="w-3.5 h-3.5" />{p.lessons} articles
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <ClipboardList className="w-3.5 h-3.5" />{p.mcqs} MCQs
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/lms/${p.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => handlePublish(p)}
                    disabled={!!loading}
                    title={p.is_published ? "Revert to Draft" : "Publish"}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {p.is_published ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(p)}
                    disabled={!!loading}
                    title="Duplicate"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={!!loading}
                    title="Delete"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
