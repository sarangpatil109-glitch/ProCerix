"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle, XCircle, AlertCircle, Award, Briefcase, Search,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw,
} from "lucide-react";

interface Check { label: string; pass: boolean; detail: string }
interface AuditResult {
  id: string;
  title: string;
  type: "certificate" | "internship";
  is_published: boolean;
  checks: Check[];
  passed: boolean;
  failCount: number;
}

export function ContentAuditPage({ results }: { results: AuditResult[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "certificate" | "internship">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pass" | "fail">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = results.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "pass" ? r.passed : !r.passed);
    return matchSearch && matchType && matchStatus;
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const certs = results.filter((r) => r.type === "certificate").length;
  const interns = results.filter((r) => r.type === "internship").length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: results.length, color: "text-gray-900 dark:text-white", bg: "bg-white" },
          { label: "PASS", value: passed, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" },
          { label: "FAIL", value: failed, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" },
          { label: "Pass Rate", value: results.length ? `${Math.round((passed / results.length) * 100)}%` : "—", color: "text-blue-600 dark:text-blue-400", bg: "bg-white" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-200 dark:border-gray-800 p-5`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rules reminder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Certificate Rules</p>
          </div>
          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <li>✓ 4–5 article modules</li>
            <li>✓ Exactly 10 MCQs</li>
            <li>✓ No video content</li>
          </ul>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-purple-500" />
            <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Internship Rules</p>
          </div>
          <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
            <li>✓ 7–8 article modules</li>
            <li>✓ Exactly 20 MCQs</li>
            <li>✓ Assignment & certificate configured</li>
          </ul>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types ({results.length})</option>
          <option value="certificate">Certificates ({certs})</option>
          <option value="internship">Internships ({interns})</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Results</option>
          <option value="fail">Failed ({failed})</option>
          <option value="pass">Passed ({passed})</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <RefreshCw className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400">No products match the filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const expanded = expandedId === r.id;
            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all ${
                  r.passed
                    ? "border-emerald-200 dark:border-emerald-900"
                    : "border-red-200 dark:border-red-900"
                }`}
              >
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Audit icon */}
                  {r.passed
                    ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    : <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}

                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.type === "certificate" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-purple-50 dark:bg-purple-900/20"}`}>
                    {r.type === "certificate"
                      ? <Award className="w-4 h-4 text-amber-500" />
                      : <Briefcase className="w-4 h-4 text-purple-500" />}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 capitalize">{r.type}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className={`text-xs font-semibold ${r.is_published ? "text-emerald-600" : "text-gray-400"}`}>
                        {r.is_published ? "Published" : "Draft"}
                      </span>
                      {!r.passed && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700">·</span>
                          <span className="text-xs font-bold text-red-500">{r.failCount} issue{r.failCount !== 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Verdict badge */}
                  <span className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${r.passed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {r.passed ? "PASS" : "FAIL"}
                  </span>

                  {/* Actions */}
                  <Link href={`/admin/lms/${r.id}?tab=audit`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors shrink-0">
                    Fix <ArrowRight className="w-3 h-3" />
                  </Link>

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedId(expanded ? null : r.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded checks */}
                {expanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.checks.map((ch, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${ch.pass ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-red-50 dark:bg-red-900/10"}`}>
                          {ch.pass
                            ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${ch.pass ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-400"}`}>{ch.label}</p>
                            <p className="text-[11px] text-gray-400 truncate">{ch.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
