"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  TrendingUp, ShoppingBag, Award, BarChart3,
  Calendar, Package, Tag, Percent,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Sale {
  id: string;
  created_at: string;
  order_id: string;
  coupon_code: string;
  purchase_amount: number;
  discount_amount: number;
  final_amount: number;
  commission_amount: number;
  commission_paid: boolean;
  payment_status: string;
  commission_percentage: number;
  // enriched
  cashfree_order_id: string;
  course_slug: string;
  course_title: string;
  course_category: string;
  course_thumbnail: string | null;
  customer_name: string;
  customer_email: string;
}

type SortKey = "date" | "course" | "amount" | "commission";
type Period  = "today" | "week" | "month" | "lifetime";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: any) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

function filterByPeriod(sales: Sale[], period: Period): Sale[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return sales.filter(s => {
    const d = new Date(s.created_at);
    switch (period) {
      case "today": return d >= today;
      case "week": {
        const ws = new Date(today);
        ws.setDate(today.getDate() - today.getDay());
        return d >= ws;
      }
      case "month":
        return d >= new Date(today.getFullYear(), today.getMonth(), 1);
      default:
        return true;
    }
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    failed:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

// ─── Sale Detail Drawer ───────────────────────────────────────────────────────

function SaleDrawer({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const open = !!sale;

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sale Details</h3>
            <p className="text-xs text-gray-400 mt-0.5">{sale ? fmtDateTime(sale.created_at) : ""}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {sale && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            {/* Course card */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
              {sale.course_thumbnail ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={sale.course_thumbnail}
                    alt={sale.course_title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
                  {sale.course_title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white leading-snug">{sale.course_title}</p>
                {sale.course_category && (
                  <p className="text-xs text-gray-500 mt-0.5">{sale.course_category}</p>
                )}
              </div>
            </div>

            {/* Customer info */}
            <Section title="Customer">
              <Row label="Name"  value={sale.customer_name} />
              <Row label="Email" value={<span className="font-mono text-xs">{sale.customer_email}</span>} />
            </Section>

            {/* Order info */}
            <Section title="Order Details">
              <Row label="Order ID"           value={<span className="font-mono text-xs break-all">{sale.order_id || "—"}</span>} />
              <Row label="Cashfree Order ID"  value={<span className="font-mono text-xs break-all">{sale.cashfree_order_id || "—"}</span>} />
              <Row label="Purchase Date"      value={fmtDateTime(sale.created_at)} />
              <Row label="Payment Status"     value={statusBadge(sale.payment_status)} />
            </Section>

            {/* Financials */}
            <Section title="Financials">
              <Row label="Sale Amount"       value={fmt(sale.purchase_amount)} />
              {Number(sale.discount_amount) > 0 && (
                <Row label="Discount Applied" value={<span className="text-red-500">−{fmt(sale.discount_amount)}</span>} />
              )}
              <Row label="Final Amount"      value={<span className="font-bold text-gray-900 dark:text-white">{fmt(sale.final_amount)}</span>} />
              <Row label="Coupon Used"       value={<span className="font-mono font-bold text-blue-600">{sale.coupon_code}</span>} />
              <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
                <Row label="Commission %"    value={`${sale.commission_percentage}%`} />
                <Row
                  label="Commission Earned"
                  value={<span className="text-lg font-extrabold text-green-600">{fmt(sale.commission_amount)}</span>}
                />
                <Row
                  label="Commission Status"
                  value={statusBadge(sale.commission_paid ? "completed" : "pending")}
                />
              </div>
            </Section>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">{value}</span>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: "asc" | "desc" }) {
  if (sortKey !== column) return <ChevronUp className="w-3 h-3 text-gray-300 dark:text-gray-600 ml-1" />;
  return sortDir === "asc"
    ? <ChevronUp   className="w-3 h-3 text-blue-600 ml-1" />
    : <ChevronDown className="w-3 h-3 text-blue-600 ml-1" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PERIODS: { id: Period; label: string }[] = [
  { id: "today",    label: "Today" },
  { id: "week",     label: "This Week" },
  { id: "month",    label: "This Month" },
  { id: "lifetime", label: "Lifetime" },
];

const PAGE_SIZE = 20;

export default function AffiliateSalesPage() {
  const [allSales, setAllSales]     = React.useState<Sale[]>([]);
  const [loading, setLoading]       = React.useState(true);
  const [period, setPeriod]         = React.useState<Period>("lifetime");
  const [search, setSearch]         = React.useState("");
  const [sortKey, setSortKey]       = React.useState<SortKey>("date");
  const [sortDir, setSortDir]       = React.useState<"asc" | "desc">("desc");
  const [page, setPage]             = React.useState(1);
  const [drawer, setDrawer]         = React.useState<Sale | null>(null);

  React.useEffect(() => {
    fetch("/api/affiliate/sales")
      .then(r => r.json())
      .then(d => setAllSales(d.sales || []))
      .catch(() => toast.error("Failed to load sales"))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    let s = filterByPeriod(allSales, period);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(x =>
        x.customer_name.toLowerCase().includes(q) ||
        x.course_title.toLowerCase().includes(q) ||
        x.course_category.toLowerCase().includes(q) ||
        x.coupon_code.toLowerCase().includes(q) ||
        x.order_id.toLowerCase().includes(q)
      );
    }
    return s;
  }, [allSales, period, search]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "date":       va = a.created_at;       vb = b.created_at;       break;
        case "course":     va = a.course_title;     vb = b.course_title;     break;
        case "amount":     va = Number(a.final_amount);     vb = Number(b.final_amount);     break;
        case "commission": va = Number(a.commission_amount); vb = Number(b.commission_amount); break;
        default:           va = a.created_at;       vb = b.created_at;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const metrics = React.useMemo(() => {
    const c = filtered.filter(s => s.payment_status === "completed");
    const rev  = c.reduce((a, s) => a + Number(s.final_amount    || 0), 0);
    const comm = c.reduce((a, s) => a + Number(s.commission_amount || 0), 0);
    return {
      totalSales: c.length,
      revenue:    rev,
      commission: comm,
      avgComm:    c.length > 0 ? comm / c.length : 0,
    };
  }, [filtered]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function handlePeriod(p: Period) {
    setPeriod(p);
    setPage(1);
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 pb-12">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Sales Report</h2>
          <p className="text-gray-500 text-sm mt-1">
            {allSales.length} total transaction{allSales.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Period filter ─────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriod(p.id)}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all ${
                period === p.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Metrics ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Sales",        value: String(metrics.totalSales),       icon: ShoppingBag,  color: "text-blue-600"   },
            { label: "Revenue Generated",  value: fmt(metrics.revenue),             icon: TrendingUp,   color: "text-green-600"  },
            { label: "Commission Earned",  value: fmt(metrics.commission),           icon: Award,        color: "text-purple-600" },
            { label: "Avg. Commission",    value: fmt(metrics.avgComm),             icon: BarChart3,    color: "text-yellow-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-xs text-gray-400 font-medium">{label}</p>
              </div>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search ───────────────────────────────────────────────────── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search course, customer, order…"
            className="w-full h-11 pl-9 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {sorted.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <Package className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">
                {allSales.length === 0 ? "No sales yet" : "No results match your search"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {allSales.length === 0
                  ? "Share your coupon code to start earning commissions."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40">

                      {/* Date — sortable */}
                      <th
                        onClick={() => toggleSort("date")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 select-none"
                      >
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          Date
                          <SortIcon column="date" sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Customer
                      </th>

                      {/* Course — sortable */}
                      <th
                        onClick={() => toggleSort("course")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 select-none"
                      >
                        <span className="flex items-center">
                          Course
                          <SortIcon column="course" sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Category
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <span className="flex items-center">
                          <Tag className="w-3.5 h-3.5 mr-1.5" />Order ID
                        </span>
                      </th>

                      {/* Sale — sortable */}
                      <th
                        onClick={() => toggleSort("amount")}
                        className="px-4 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 select-none"
                      >
                        <span className="flex items-center justify-end">
                          Sale
                          <SortIcon column="amount" sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Coupon
                      </th>

                      <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Discount
                      </th>

                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <span className="flex items-center justify-center">
                          <Percent className="w-3 h-3 mr-1" />Comm
                        </span>
                      </th>

                      {/* Commission earned — sortable */}
                      <th
                        onClick={() => toggleSort("commission")}
                        className="px-4 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 select-none"
                      >
                        <span className="flex items-center justify-end">
                          Earned
                          <SortIcon column="commission" sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>

                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginated.map(s => (
                      <tr
                        key={s.id}
                        onClick={() => setDrawer(s)}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                      >
                        {/* Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{fmtDate(s.created_at)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(s.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4 min-w-40">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                            {s.customer_name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{s.customer_email}</p>
                        </td>

                        {/* Course */}
                        <td className="px-4 py-4 min-w-44">
                          <div className="flex items-center gap-3">
                            {s.course_thumbnail ? (
                              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                                <Image
                                  src={s.course_thumbnail}
                                  alt={s.course_title}
                                  width={36}
                                  height={36}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {s.course_title.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                              {s.course_title}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {s.course_category ? (
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {s.course_category}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-gray-400">
                            …{s.order_id.slice(-10) || "—"}
                          </span>
                        </td>

                        {/* Sale amount */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(s.final_amount)}</p>
                          {Number(s.purchase_amount) !== Number(s.final_amount) && (
                            <p className="text-xs text-gray-400 line-through mt-0.5">{fmt(s.purchase_amount)}</p>
                          )}
                        </td>

                        {/* Coupon */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg">
                            {s.coupon_code}
                          </span>
                        </td>

                        {/* Discount */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          {Number(s.discount_amount) > 0 ? (
                            <span className="text-xs text-red-500 font-medium">−{fmt(s.discount_amount)}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Commission % */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs text-gray-500">{s.commission_percentage}%</span>
                        </td>

                        {/* Commission earned */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600">+{fmt(s.commission_amount)}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">{statusBadge(s.payment_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ───────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} sales
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500 px-3 font-medium">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Sale Detail Drawer ─────────────────────────────────────────────── */}
      <SaleDrawer sale={drawer} onClose={() => setDrawer(null)} />
    </>
  );
}
