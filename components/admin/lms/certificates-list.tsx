"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Award, Search, Pencil, Trash2, Copy, Globe, EyeOff,
  FileText, ClipboardList, Eye, Plus, Star, CheckCircle, XCircle,
} from "lucide-react";

interface CertProduct {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  is_featured: boolean;
  price: number;
  original_price: number;
  category: string | null;
  difficulty: string | null;
  thumbnail_url: string | null;
  passing_percentage: number | null;
  validity_period: string | null;
  certificate_template: string | null;
  lessons: number;
  mcqs: number;
  enrollments: number;
}

export function CertificatesList({ products }: { products: CertProduct[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const filtered = products.filter((p) => {
    const matchSearch = (p.title + (p.category || "")).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "published" ? p.is_published : !p.is_published);
    return matchSearch && matchStatus;
  });

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

  const handlePublish = (p: CertProduct) => {
    call("PUBLISH_COURSE", p.id, { is_published: !p.is_published }).then(() =>
      toast.success(p.is_published ? "Moved to Draft" : "Published!")
    );
  };
  const handleDuplicate = (p: CertProduct) => call("DUPLICATE_COURSE", p.id).then(() => toast.success("Duplicated!"));
  const handleDelete = (p: CertProduct) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    call("DELETE_COURSE", p.id).then(() => toast.success("Deleted"));
  };

  const published = products.filter((p) => p.is_published).length;
  const passAudit = products.filter((p) => p.lessons >= 4 && p.lessons <= 5 && p.mcqs === 10).length;

  // Validate a single cert for audit quick-check
  const auditPassed = (p: CertProduct) => p.lessons >= 4 && p.lessons <= 5 && p.mcqs === 10;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Certificates", value: products.length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Published", value: published, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Drafts", value: products.length - published, color: "text-gray-500" },
          { label: "Audit Ready", value: passAudit, color: "text-blue-600 dark:text-blue-400" },
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
            placeholder="Search certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Link
          href="/admin/lms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />New Certificate
        </Link>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Award className="w-12 h-12 text-amber-200 dark:text-amber-900 mx-auto mb-4" />
          <p className="font-semibold text-gray-500">No certificates found</p>
          <Link href="/admin/lms/new" className="mt-4 inline-flex items-center gap-2 text-sm text-amber-600 font-medium hover:underline">
            <Plus className="w-3.5 h-3.5" />Create a Certificate
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</div>
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Articles</div>
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">MCQs</div>
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Audit</div>
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((p) => {
              const busy = (a: string) => loading === `${a}-${p.id}`;
              const passed = auditPassed(p);
              return (
                <div key={p.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">₹{p.price}{p.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline ml-1" />}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">{p.category || "—"}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs font-bold ${p.lessons >= 4 && p.lessons <= 5 ? "text-emerald-600" : "text-red-500"}`}>{p.lessons}</span>
                    <span className="text-xs text-gray-400">/5</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs font-bold ${p.mcqs === 10 ? "text-emerald-600" : "text-red-500"}`}>{p.mcqs}</span>
                    <span className="text-xs text-gray-400">/10</span>
                  </div>
                  <div className="col-span-1 text-center">
                    {passed
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                      : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                      {p.is_published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 justify-end">
                    <Link href={`/admin/lms/${p.id}`} title="Edit"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/admin/lms/${p.id}?tab=preview`} title="Preview"
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => handlePublish(p)} disabled={!!loading} title={p.is_published ? "Unpublish" : "Publish"}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      {p.is_published ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                    <button onClick={() => handleDuplicate(p)} disabled={!!loading} title="Duplicate"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(p)} disabled={!!loading} title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit reminder */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl text-sm text-amber-700 dark:text-amber-300">
        <strong>Certificate Requirements:</strong> 4–5 article modules, exactly 10 MCQs, no video content.
        <Link href="/admin/lms/content-audit" className="ml-2 underline font-semibold hover:no-underline">
          Run full audit →
        </Link>
      </div>
    </div>
  );
}
