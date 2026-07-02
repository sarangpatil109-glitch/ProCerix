"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen, Briefcase, Search, Pencil, Trash2, Copy, Globe, EyeOff,
  Layers, FileText, ClipboardList, Star, Award, Eye, Plus, ChevronDown,
  CheckCircle, XCircle, Filter,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  course_type: string;
  is_published: boolean;
  is_featured: boolean;
  lms_status?: string;
  price: number;
  original_price: number;
  category: string | null;
  difficulty: string | null;
  thumbnail_url: string | null;
  modules: number;
  lessons: number;
  mcqs: number;
  enrollments?: number;
}

export function LmsProductList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "certificates" | "certificate" | "internship">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = (p.title + (p.category || "")).toLowerCase().includes(search.toLowerCase());
      const matchType =
        typeFilter === "all" ||
        p.course_type === typeFilter ||
        (typeFilter === "certificates" && p.course_type === "certificate");
      const matchStatus = statusFilter === "all" || (statusFilter === "published" ? p.is_published : !p.is_published);
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
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
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

  const isCertType = (c: string) => c === "certificates" || c === "certificate";

  const certCount    = products.filter((p) => isCertType(p.course_type)).length;
  const internCount  = products.filter((p) => p.course_type === "internship").length;
  const publishedCount = products.filter((p) => p.is_published).length;
  const draftCount   = products.length - publishedCount;

  // Quick audit pass check
  const auditPass = (p: Product) =>
    isCertType(p.course_type)
      ? p.lessons >= 4 && p.lessons <= 5 && p.mcqs === 10
      : p.lessons >= 7 && p.lessons <= 8 && p.mcqs === 20;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: products.length, color: "text-gray-900 dark:text-white" },
          { label: "Certificates", value: certCount, color: "text-amber-600 dark:text-amber-400" },
          { label: "Internships", value: internCount, color: "text-purple-600 dark:text-purple-400" },
          { label: "Published", value: publishedCount, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Drafts", value: draftCount, color: "text-gray-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Create */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or category..."
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
        <Link
          href="/admin/lms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />Create Product
        </Link>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="font-semibold text-gray-500">No products found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting the filters or create a new product</p>
          <Link href="/admin/lms/new" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
            <Plus className="w-3.5 h-3.5" />Create your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</div>
            <div className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</div>
            <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Articles</div>
            <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">MCQs</div>
            <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Audit</div>
            <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</div>
            <div className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((p) => {
              const isCert = isCertType(p.course_type);
              const passed = auditPass(p);
              const busy = (a: string) => loading === `${a}-${p.id}`;

              return (
                <div key={p.id} className="flex md:grid md:grid-cols-12 flex-col gap-3 md:gap-3 px-5 py-4 items-start md:items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  {/* Product */}
                  <div className="md:col-span-4 flex items-center gap-3 w-full md:w-auto">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCert ? "bg-amber-50 dark:bg-amber-900/20" : "bg-purple-50 dark:bg-purple-900/20"}`}>
                      {isCert ? <Award className="w-5 h-5 text-amber-500" /> : <Briefcase className="w-5 h-5 text-purple-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.title}</p>
                        {p.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isCert ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                          {isCert ? "Certificate" : "Internship"}
                        </span>
                        <span className="text-xs text-gray-400">₹{p.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="md:col-span-2 hidden md:block">
                    <span className="text-xs text-gray-500 truncate">{p.category || "—"}</span>
                  </div>

                  {/* Articles */}
                  <div className="md:col-span-1 hidden md:flex items-center justify-center gap-0.5">
                    <span className={`text-sm font-bold ${
                      isCert
                        ? (p.lessons >= 4 && p.lessons <= 5 ? "text-emerald-600" : "text-red-500")
                        : (p.lessons >= 7 && p.lessons <= 8 ? "text-emerald-600" : "text-red-500")
                    }`}>{p.lessons}</span>
                    <span className="text-xs text-gray-300">/{isCert ? "5" : "8"}</span>
                  </div>

                  {/* MCQs */}
                  <div className="md:col-span-1 hidden md:flex items-center justify-center gap-0.5">
                    <span className={`text-sm font-bold ${p.mcqs === (isCert ? 10 : 20) ? "text-emerald-600" : "text-red-500"}`}>{p.mcqs}</span>
                    <span className="text-xs text-gray-300">/{isCert ? "10" : "20"}</span>
                  </div>

                  {/* Audit */}
                  <div className="md:col-span-1 hidden md:flex justify-center">
                    {passed
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1 hidden md:flex justify-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {p.is_published ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center gap-1.5 md:justify-end w-full md:w-auto flex-wrap">
                    <Link href={`/admin/lms/${p.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                      <Pencil className="w-3 h-3" />Edit
                    </Link>
                    <Link href={`/admin/lms/${p.id}?tab=preview`} title="Preview"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                    </Link>
                    <button
                      onClick={() => handlePublish(p)} disabled={!!loading} title={p.is_published ? "Move to Draft" : "Publish"}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      {p.is_published ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)} disabled={!!loading} title="Duplicate"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)} disabled={!!loading} title="Delete"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-gray-400">
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  );
}
