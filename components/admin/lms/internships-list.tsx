"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase, Search, Pencil, Trash2, Copy, Globe, EyeOff,
  FileText, ClipboardList, Eye, Plus, Star, CheckCircle, XCircle,
  Building2, Clock,
} from "lucide-react";

interface InternProduct {
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
  company_name: string | null;
  supervisor_name: string | null;
  duration: string | null;
  assignment_required: boolean | null;
  lessons: number;
  mcqs: number;
  enrollments: number;
}

export function InternshipsList({ products }: { products: InternProduct[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const filtered = products.filter((p) => {
    const matchSearch = (p.title + (p.category || "") + (p.company_name || "")).toLowerCase().includes(search.toLowerCase());
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

  const handlePublish = (p: InternProduct) =>
    call("PUBLISH_COURSE", p.id, { is_published: !p.is_published }).then(() =>
      toast.success(p.is_published ? "Moved to Draft" : "Published!")
    );
  const handleDuplicate = (p: InternProduct) => call("DUPLICATE_COURSE", p.id).then(() => toast.success("Duplicated!"));
  const handleDelete = (p: InternProduct) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    call("DELETE_COURSE", p.id).then(() => toast.success("Deleted"));
  };

  const published = products.filter((p) => p.is_published).length;
  const passAudit = products.filter((p) => p.lessons >= 7 && p.lessons <= 8 && p.mcqs === 20).length;

  const auditPassed = (p: InternProduct) => p.lessons >= 7 && p.lessons <= 8 && p.mcqs === 20;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Internships", value: products.length, color: "text-purple-600 dark:text-purple-400" },
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
            placeholder="Search by title, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Link
          href="/admin/lms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />New Internship
        </Link>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Briefcase className="w-12 h-12 text-purple-200 dark:text-purple-900 mx-auto mb-4" />
          <p className="font-semibold text-gray-500">No internships found</p>
          <Link href="/admin/lms/new" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 font-medium hover:underline">
            <Plus className="w-3.5 h-3.5" />Create a Virtual Internship
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => {
            const passed = auditPassed(p);
            return (
              <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{p.title}</h3>
                      {p.is_published
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Live</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">Draft</span>}
                      {passed
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" />Audit OK</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5" />Audit Fail</span>}
                    </div>

                    {/* Company / Duration */}
                    <div className="flex flex-wrap gap-3 mb-2">
                      {p.company_name && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Building2 className="w-3.5 h-3.5" />{p.company_name}
                        </span>
                      )}
                      {p.duration && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />{p.duration}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{p.category || "No category"} · ₹{p.price}</span>
                    </div>

                    {/* Counts with audit validation */}
                    <div className="flex items-center gap-4">
                      <span className={`flex items-center gap-1 text-xs font-semibold ${p.lessons >= 7 && p.lessons <= 8 ? "text-emerald-600" : "text-red-500"}`}>
                        <FileText className="w-3.5 h-3.5" />{p.lessons} articles <span className="text-gray-400 font-normal">(need 7–8)</span>
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${p.mcqs === 20 ? "text-emerald-600" : "text-red-500"}`}>
                        <ClipboardList className="w-3.5 h-3.5" />{p.mcqs} MCQs <span className="text-gray-400 font-normal">(need 20)</span>
                      </span>
                      {p.assignment_required && (
                        <span className="text-xs text-purple-600 font-semibold">+ Assignment</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/admin/lms/${p.id}`} title="Edit"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </Link>
                    <Link href={`/admin/lms/${p.id}?tab=preview`} title="Preview"
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Link>
                    <button onClick={() => handlePublish(p)} disabled={!!loading} title={p.is_published ? "Unpublish" : "Publish"}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      {p.is_published ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                    </button>
                    <button onClick={() => handleDuplicate(p)} disabled={!!loading} title="Duplicate"
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(p)} disabled={!!loading} title="Delete"
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit reminder */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl text-sm text-purple-700 dark:text-purple-300">
        <strong>Internship Requirements:</strong> 7–8 article modules, exactly 20 MCQs, company name, optional assignment submission.
        <Link href="/admin/lms/content-audit" className="ml-2 underline font-semibold hover:no-underline">
          Run full audit →
        </Link>
      </div>
    </div>
  );
}
