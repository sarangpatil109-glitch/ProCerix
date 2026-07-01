"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  TrendingUp, ShoppingBag, Award, BarChart3, Package,
  Calendar, Tag, Percent, User,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Sale {
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
  cashfree_order_id: string;
  course_title: string;
  course_category: string;
  course_thumbnail: string | null;
  course_slug: string;
  customer_name: string;
  customer_email: string;
}

type SortKey = "date" | "course" | "amount" | "commission";
type Period  = "today" | "week" | "month" | "lifetime";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

function filterByPeriod(sales: Sale[], period: Period): Sale[] {
  const now   = new Date();
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

const STATUS_CLS: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_CLS[status] ?? STATUS_CLS.pending}`}>
      {status}
    </span>
  );
}

function CourseBadge({ title, thumbnail }: { title: string; thumbnail: string | null }) {
  return thumbnail ? (
    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
      <Image src={thumbnail} alt={title} width={36} height={36} className="w-full h-full object-cover" unoptimized />
    </div>
  ) : (
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Side Drawer ─────────────────────────────────────────────────────────────

function SaleDrawer({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const open = !!sale;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Sale Details</h3>
            {sale && <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(sale.created_at)}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors -mr-1 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        {sale && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            {/* Course card */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100/60 dark:border-blue-800/30">
              {sale.course_thumbnail ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/60 shadow-sm">
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
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shrink-0 shadow-sm">
                  {sale.course_title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white leading-snug">{sale.course_title}</p>
                {sale.course_category && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/70 dark:bg-white/10 text-xs text-gray-600 dark:text-gray-300 rounded-lg font-medium">
                    {sale.course_category}
                  </span>
                )}
              </div>
            </div>

            {/* Customer */}
            <DrawerSection title="Customer">
              <DrawerRow label="Name"  value={sale.customer_name} />
              <DrawerRow label="Email" value={<span className="font-mono text-xs">{sale.customer_email}</span>} />
            </DrawerSection>

            {/* Order */}
            <DrawerSection title="Order Details">
              <DrawerRow label="Order ID"          value={<Mono>{sale.order_id || "—"}</Mono>} />
              <DrawerRow label="Cashfree Order ID" value={<Mono>{sale.cashfree_order_id || "—"}</Mono>} />
              <DrawerRow label="Purchase Date"     value={fmtDate(sale.created_at)} />
              <DrawerRow label="Purchase Time"     value={fmtTime(sale.created_at)} />
              <DrawerRow label="Coupon Used"       value={<span className="font-mono font-bold text-blue-600">{sale.coupon_code}</span>} />
              <DrawerRow label="Status"            value={<StatusBadge status={sale.payment_status} />} />
            </DrawerSection>

            {/* Financials */}
            <DrawerSection title="Financials">
              <DrawerRow label="Sale Amount"   value={fmt(sale.purchase_amount)} />
              {sale.discount_amount > 0 && (
                <DrawerRow label="Discount" value={<span className="text-red-500 font-semibold">−{fmt(sale.discount_amount)}</span>} />
              )}
              <DrawerRow
                label="Final Amount"
                value={<span className="font-extrabold text-gray-900 dark:text-white">{fmt(sale.final_amount)}</span>}
              />
              <div className="mx-4 my-1 border-t border-gray-100 dark:border-gray-800" />
              <DrawerRow label="Commission %" value={`${sale.commission_percentage}%`} />
              <DrawerRow
                label="Commission Earned"
                value={
                  <span className="text-xl font-extrabold text-green-600">
                    +{fmt(sale.commission_amount)}
                  </span>
                }
              />
              <DrawerRow
                label="Commission Status"
                value={<StatusBadge status={sale.commission_paid ? "completed" : "pending"} />}
              />
            </DrawerSection>

          </div>
        )}
      </aside>
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">{title}</p>
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
        {children}
      </div>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">{value}</span>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs text-gray-500 break-all">{children}</span>;
}

// ─── Sort button ──────────────────────────────────────────────────────────────

function SortBtn({
  children, col, sortKey, sortDir, onSort,
  align = "left",
}: {
  children: React.ReactNode;
  col: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === col;
  const Icon   = active && sortDir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-200 transition-colors ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {children}
        <Icon className={`w-3 h-3 transition-colors ${active ? "text-blue-600" : "text-gray-300 dark:text-gray-700"}`} />
      </span>
    </th>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PERIODS: { id: Period; label: string }[] = [
  { id: "today",    label: "Today" },
  { id: "week",     label: "This Week" },
  { id: "month",    label: "This Month" },
  { id: "lifetime", label: "Lifetime" },
];

const PAGE_SIZE = 20;

export function SalesClient({ sales: initialSales }: { sales: Sale[] }) {
  const [period,  setPeriod]  = React.useState<Period>("lifetime");
  const [search,  setSearch]  = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page,    setPage]    = React.useState(1);
  const [drawer,  setDrawer]  = React.useState<Sale | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    let s = filterByPeriod(initialSales, period);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(x =>
        x.customer_name.toLowerCase().includes(q) ||
        x.course_title.toLowerCase().includes(q) ||
        x.course_category.toLowerCase().includes(q) ||
        x.order_id.toLowerCase().includes(q) ||
        x.coupon_code.toLowerCase().includes(q)
      );
    }
    return s;
  }, [initialSales, period, search]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (sortKey) {
        case "course":     va = a.course_title;     vb = b.course_title;      break;
        case "amount":     va = a.final_amount;     vb = b.final_amount;      break;
        case "commission": va = a.commission_amount; vb = b.commission_amount; break;
        default:           va = a.created_at;       vb = b.created_at;
      }
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages  = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const metrics = React.useMemo(() => {
    const c    = filtered.filter(s => s.payment_status === "completed");
    const comm = c.reduce((a, s) => a + s.commission_amount, 0);
    const rev  = c.reduce((a, s) => a + s.final_amount, 0);
    return { count: c.length, revenue: rev, commission: comm, avg: c.length ? comm / c.length : 0 };
  }, [filtered]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Sales Report</h2>
          <p className="text-gray-500 text-sm mt-1">
            {initialSales.length} total sale{initialSales.length !== 1 ? "s" : ""} · click any row to view full details
          </p>
        </div>

        {/* Period pills */}
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => { setPeriod(p.id); setPage(1); }}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all ${
                period === p.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Sales",       value: String(metrics.count),    icon: ShoppingBag, color: "text-blue-600"   },
            { label: "Revenue Generated", value: fmt(metrics.revenue),     icon: TrendingUp,  color: "text-green-600"  },
            { label: "Commission Earned", value: fmt(metrics.commission),  icon: Award,       color: "text-purple-600" },
            { label: "Avg. Commission",   value: fmt(metrics.avg),         icon: BarChart3,   color: "text-yellow-600" },
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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search course, customer, order…"
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {sorted.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-6">
              <Package className="w-12 h-12 text-gray-200 dark:text-gray-700" />
              <p className="font-semibold text-gray-500 dark:text-gray-400">
                {initialSales.length === 0 ? "No sales yet" : "No results match your search"}
              </p>
              <p className="text-sm text-gray-400">
                {initialSales.length === 0
                  ? "Share your coupon code to start earning commissions."
                  : "Try adjusting the search term or selecting a different period."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40">
                      {/* Date — sortable */}
                      <SortBtn col="date"       sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                        <Calendar className="w-3.5 h-3.5 mr-1 shrink-0" />Date
                      </SortBtn>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Customer</span>
                      </th>

                      {/* Course — sortable */}
                      <SortBtn col="course" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>
                        Course
                      </SortBtn>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Category
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Order</span>
                      </th>

                      {/* Sale — sortable */}
                      <SortBtn col="amount" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">
                        Sale
                      </SortBtn>

                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Coupon
                      </th>

                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <span className="flex items-center justify-center gap-0.5">
                          <Percent className="w-3 h-3" />Comm
                        </span>
                      </th>

                      {/* Commission earned — sortable */}
                      <SortBtn col="commission" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">
                        Earned
                      </SortBtn>

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
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                      >
                        {/* Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{fmtDate(s.created_at)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtTime(s.created_at)}</p>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4 min-w-40">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{s.customer_name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{s.customer_email}</p>
                        </td>

                        {/* Course */}
                        <td className="px-4 py-4 min-w-52">
                          <div className="flex items-center gap-3">
                            <CourseBadge title={s.course_title} thumbnail={s.course_thumbnail} />
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
                            <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
                          )}
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-gray-400">…{s.order_id.slice(-10) || "—"}</span>
                        </td>

                        {/* Sale amount */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(s.final_amount)}</p>
                          {s.discount_amount > 0 && (
                            <p className="text-xs text-gray-400 line-through mt-0.5">{fmt(s.purchase_amount)}</p>
                          )}
                        </td>

                        {/* Coupon */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg whitespace-nowrap">
                            {s.coupon_code}
                          </span>
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
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={s.payment_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} sales
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500 px-2 font-medium">{page} / {totalPages}</span>
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

      <SaleDrawer sale={drawer} onClose={() => setDrawer(null)} />
    </>
  );
}
