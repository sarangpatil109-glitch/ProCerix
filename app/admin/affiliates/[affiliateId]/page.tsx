"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, CheckCircle, XCircle, Edit2, ExternalLink,
  Search, Download, ChevronLeft, ChevronRight, Mail, Phone,
  Building2, CreditCard, Wallet, TrendingUp, ShoppingCart,
  Percent, BarChart3, Calendar,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AffiliateData {
  profile: any;
  wallet: any;
  sales: any[];
  weeklyPayouts: any[];
  withdrawals: any[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",     label: "Overview" },
  { id: "sales",        label: "Sales History" },
  { id: "payouts",      label: "Commissions & Payouts" },
  { id: "withdrawals",  label: "Withdrawals" },
  { id: "timeline",     label: "Timeline" },
] as const;

const PERIODS = [
  { id: "today",     label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week",      label: "This Week" },
  { id: "month",     label: "This Month" },
  { id: "lifetime",  label: "Lifetime" },
];

const SALES_PER_PAGE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: any) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function filterByPeriod(sales: any[], period: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return sales.filter((s) => {
    const d = new Date(s.created_at);
    switch (period) {
      case "today": return d >= today;
      case "yesterday": {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        return d >= y && d < today;
      }
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
    paid:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    approved:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pending:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    rejected:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    failed:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    inactive:   "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    active:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const affiliateId = params.affiliateId as string;

  const [data, setData]           = React.useState<AffiliateData | null>(null);
  const [loading, setLoading]     = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const [period, setPeriod]       = React.useState("lifetime");
  const [search, setSearch]       = React.useState("");
  const [statusFilter, setStatus] = React.useState("all");
  const [salesPage, setSalesPage] = React.useState(1);
  const [editModal, setEditModal] = React.useState<{ field: string; label: string; value: string } | null>(null);
  const [saving, setSaving]       = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`);
      if (!res.ok) throw new Error("Failed to load affiliate");
      setData(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  React.useEffect(() => { load(); }, [load]);

  // ── Derived: filtered + paginated sales ──────────────────────────────────

  const filteredSales = React.useMemo(() => {
    if (!data) return [];
    let s = filterByPeriod(data.sales, period);
    if (statusFilter !== "all") s = s.filter(x => x.payment_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(x =>
        x.payment?.customer_name?.toLowerCase().includes(q) ||
        x.payment?.customer_email?.toLowerCase().includes(q) ||
        x.payment?.course_slug?.toLowerCase().includes(q) ||
        x.payment?.skill_name?.toLowerCase().includes(q) ||
        (x.order_id ?? "").toLowerCase().includes(q)
      );
    }
    return s;
  }, [data, period, statusFilter, search]);

  const paginatedSales = React.useMemo(() => {
    const start = (salesPage - 1) * SALES_PER_PAGE;
    return filteredSales.slice(start, start + SALES_PER_PAGE);
  }, [filteredSales, salesPage]);

  const totalPages = Math.ceil(filteredSales.length / SALES_PER_PAGE);

  // ── Derived: performance metrics ─────────────────────────────────────────

  const metrics = React.useMemo(() => {
    const completed = filteredSales.filter(s => s.payment_status === "completed");
    const amounts   = completed.map(s => Number(s.final_amount || 0));
    const totalRev  = amounts.reduce((a, v) => a + v, 0);
    const clicks    = data?.profile?.total_clicks || 0;
    return {
      clicks,
      orders:     completed.length,
      revenue:    totalRev,
      commission: completed.reduce((a, s) => a + Number(s.commission_amount || 0), 0),
      aov:        completed.length > 0 ? totalRev / completed.length : 0,
      highest:    amounts.length > 0 ? Math.max(...amounts) : 0,
      lowest:     amounts.length > 0 ? Math.min(...amounts) : 0,
      conversion: clicks > 0 ? ((completed.length / clicks) * 100).toFixed(1) : "0.0",
    };
  }, [filteredSales, data?.profile?.total_clicks]);

  // ── Derived: coupon analytics (lifetime always) ───────────────────────────

  const couponStats = React.useMemo(() => {
    if (!data) return null;
    const completed = data.sales.filter(s => s.payment_status === "completed");
    return {
      usage:      data.sales.length,
      discount:   data.sales.reduce((a, s) => a + Number(s.discount_amount || 0), 0),
      revenue:    completed.reduce((a, s) => a + Number(s.final_amount || 0), 0),
      conversion: (data.profile.total_clicks || 0) > 0
        ? ((completed.length / data.profile.total_clicks) * 100).toFixed(1)
        : "0.0",
    };
  }, [data]);

  // ── Derived: timeline ────────────────────────────────────────────────────

  const timeline = React.useMemo(() => {
    if (!data) return [];
    const events: { date: string; icon: string; title: string; desc: string }[] = [];

    events.push({
      date: data.profile.created_at,
      icon: "🎉", title: "Affiliate Created",
      desc: `${data.profile.name} joined as an affiliate`,
    });
    events.push({
      date: data.profile.created_at,
      icon: "🎟️", title: "Coupon Generated",
      desc: `Coupon code ${data.profile.coupon_code} was assigned`,
    });

    for (const s of data.sales) {
      events.push({
        date: s.created_at,
        icon: "💰", title: "Sale Completed",
        desc: `${fmt(s.final_amount)} — Commission ${fmt(s.commission_amount)} · ${s.payment?.customer_name || "customer"}`,
      });
    }

    for (const p of data.weeklyPayouts) {
      if (["approved", "processing"].includes(p.status)) {
        events.push({
          date: p.approved_at || p.created_at,
          icon: "✅", title: "Payout Approved",
          desc: `${fmt(p.amount)} for week ${fmtDate(p.week_start)}–${fmtDate(p.week_end)}`,
        });
      }
      if (p.status === "paid") {
        events.push({
          date: p.paid_at || p.created_at,
          icon: "🏦", title: "Payout Transferred",
          desc: `${fmt(p.amount)}${p.cashfree_transfer_id ? ` (${p.cashfree_transfer_id})` : ""}`,
        });
      }
      if (p.status === "rejected") {
        events.push({
          date: p.updated_at || p.created_at,
          icon: "❌", title: "Payout Rejected",
          desc: `${fmt(p.amount)} — ${p.remarks || "no reason given"}`,
        });
      }
    }

    for (const w of data.withdrawals) {
      events.push({
        date: w.created_at,
        icon: "📤", title: "Withdrawal Requested",
        desc: `${fmt(w.amount)} via ${w.upi_id || "bank transfer"}`,
      });
      if (w.status === "paid") {
        events.push({
          date: w.updated_at || w.created_at,
          icon: "✅", title: "Withdrawal Transferred",
          desc: `${fmt(w.amount)}${w.payment_reference ? ` — Ref: ${w.payment_reference}` : ""}`,
        });
      } else if (w.status === "approved") {
        events.push({
          date: w.updated_at || w.created_at,
          icon: "👍", title: "Withdrawal Approved",
          desc: `${fmt(w.amount)}`,
        });
      } else if (w.status === "rejected") {
        events.push({
          date: w.updated_at || w.created_at,
          icon: "❌", title: "Withdrawal Rejected",
          desc: `${fmt(w.amount)}${w.notes ? ` — ${w.notes}` : ""}`,
        });
      }
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const saveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {};
      if (editModal.field === "commission_percentage") body.commission_percentage = Number(editModal.value);
      else if (editModal.field === "discount_value")   body.discount_value = Number(editModal.value);
      else if (editModal.field === "coupon_code")      body.coupon_code = editModal.value.trim().toUpperCase();

      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`${editModal.label} updated`);
      setEditModal(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!data) return;
    const newStatus = data.profile.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { toast.success(`Affiliate ${newStatus}`); load(); }
    else toast.error("Update failed");
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = [
      "Order ID", "Customer Name", "Customer Email", "Course", "Category",
      "Purchase Amount (₹)", "Discount (₹)", "Final Amount (₹)",
      "Commission %", "Commission Earned (₹)", "Date", "Payment Status", "Cashfree Order ID",
    ];
    const rows = filteredSales.map(s => [
      s.order_id || "",
      s.payment?.customer_name || "",
      s.payment?.customer_email || "",
      s.payment?.course_slug || "",
      s.payment?.skill_name || s.product_type || "",
      s.purchase_amount ?? 0,
      s.discount_amount ?? 0,
      s.final_amount ?? 0,
      data.profile.commission_percentage ?? 0,
      s.commission_amount ?? 0,
      new Date(s.created_at).toLocaleDateString("en-IN"),
      s.payment_status || "",
      s.order_id || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate_${data.profile.coupon_code}_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-16 text-gray-400 text-sm">Affiliate not found.</div>;
  }

  const { profile, wallet, sales, weeklyPayouts, withdrawals } = data;
  const pendingPayoutAmt = weeklyPayouts
    .filter((p: any) => ["pending", "approved", "processing"].includes(p.status))
    .reduce((a: number, p: any) => a + Number(p.amount || 0), 0);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{profile.name}</h1>
              {statusBadge(profile.status)}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />{profile.email}
              <span className="text-gray-300">·</span>
              ID: <span className="font-mono">{profile.id.slice(0, 8)}…</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEditModal({ field: "commission_percentage", label: "Commission %", value: String(profile.commission_percentage) })}
            className="h-9 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />Commission
          </button>
          <button
            onClick={() => setEditModal({ field: "discount_value", label: "Discount Value", value: String(profile.discount_value) })}
            className="h-9 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />Discount
          </button>
          <button
            onClick={() => setEditModal({ field: "coupon_code", label: "Coupon Code", value: profile.coupon_code })}
            className="h-9 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />Coupon
          </button>
          <button
            onClick={() => copy(profile.coupon_code, "Coupon")}
            className="h-9 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />Copy Coupon
          </button>
          <button
            onClick={() => copy(
              `${typeof window !== "undefined" ? window.location.origin : ""}/r/${profile.coupon_code}`,
              "Referral link",
            )}
            className="h-9 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />Copy Link
          </button>
          <button
            onClick={toggleStatus}
            className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              profile.status === "active"
                ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400"
                : "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400"
            }`}
          >
            {profile.status === "active"
              ? <><XCircle className="w-3.5 h-3.5" />Deactivate</>
              : <><CheckCircle className="w-3.5 h-3.5" />Activate</>}
          </button>
        </div>
      </div>

      {/* ── Profile + Bank details ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Profile card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />Profile Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[
              { label: "Coupon Code",   value: <span className="font-mono font-bold text-blue-600">{profile.coupon_code}</span> },
              { label: "Commission",    value: `${profile.commission_percentage}%` },
              { label: "Discount",      value: profile.discount_type === "flat" ? `₹${profile.discount_value}` : `${profile.discount_value}%` },
              { label: "Joined",        value: fmtDate(profile.created_at) },
              { label: "Phone",         value: profile.phone || "—" },
              { label: "Bank Verified", value: profile.bank_verified
                ? <span className="text-green-600 font-semibold">✓ Verified</span>
                : <span className="text-yellow-600">Unverified</span> },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bank card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Building2 className="w-4 h-4" />Bank Details
          </h2>
          <div className="space-y-3">
            {[
              { label: "Bank",             value: profile.bank_name || "—" },
              { label: "Account Holder",   value: profile.account_holder || "—" },
              { label: "Account Number",   value: profile.account_number ? `••••${String(profile.account_number).slice(-4)}` : "—" },
              { label: "IFSC",             value: profile.ifsc_code || "—" },
              { label: "Branch",           value: profile.branch_name || "—" },
              { label: "UPI ID",           value: profile.upi_id || "—" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Wallet metrics ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned",    value: fmt(wallet?.total_earned),    icon: TrendingUp,    color: "text-blue-600"   },
          { label: "Total Paid Out",  value: fmt(wallet?.total_paid),      icon: CreditCard,    color: "text-green-600"  },
          { label: "Wallet Balance",  value: fmt(wallet?.available_balance), icon: Wallet,      color: "text-purple-600" },
          { label: "Pending Payout",  value: fmt(pendingPayoutAmt),        icon: Calendar,      color: "text-yellow-600" },
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

      {/* ── Period filter ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-semibold mr-1">Filter:</span>
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => { setPeriod(p.id); setSalesPage(1); }}
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

      {/* ── Performance cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Clicks",    value: metrics.clicks.toLocaleString("en-IN") },
          { label: "Total Orders",    value: metrics.orders.toLocaleString("en-IN") },
          { label: "Conversion Rate", value: `${metrics.conversion}%` },
          { label: "Revenue",         value: fmt(metrics.revenue) },
          { label: "Commission",      value: fmt(metrics.commission) },
          { label: "Avg. Order Value",value: fmt(metrics.aov) },
          { label: "Highest Sale",    value: metrics.orders > 0 ? fmt(metrics.highest) : "—" },
          { label: "Lowest Sale",     value: metrics.orders > 0 ? fmt(metrics.lowest)  : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
              {t.id === "sales" && (
                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  {filteredSales.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Tab: Overview (coupon analytics)                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && couponStats && (
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />Coupon Analytics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Coupon Usage Count",    value: couponStats.usage.toLocaleString("en-IN"),  color: "text-blue-600" },
              { label: "Total Discount Given",  value: fmt(couponStats.discount),                   color: "text-red-500" },
              { label: "Revenue Generated",     value: fmt(couponStats.revenue),                    color: "text-green-600" },
              { label: "Conversion Rate",       value: `${couponStats.conversion}%`,                color: "text-purple-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
                <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Totals summary */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Lifetime Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Sales",      value: String(sales.length) },
                { label: "Total Revenue",    value: fmt(sales.reduce((a, s) => a + Number(s.final_amount || 0), 0)) },
                { label: "Total Commission", value: fmt(sales.reduce((a, s) => a + Number(s.commission_amount || 0), 0)) },
                { label: "Total Paid Out",   value: fmt(wallet?.total_paid) },
                { label: "Wallet Balance",   value: fmt(wallet?.available_balance) },
                { label: "Pending Payout",   value: fmt(pendingPayoutAmt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Tab: Sales History                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setSalesPage(1); }}
                placeholder="Search name, email, course, order…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatus(e.target.value); setSalesPage(1); }}
              className="h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <button
              onClick={exportCSV}
              className="h-10 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                    {[
                      "Order ID", "Customer", "Course", "Category",
                      "Price", "Discount", "Comm %", "Earned", "Date", "Status",
                    ].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-14 text-gray-400 text-sm">
                        No sales found for the selected filters.
                      </td>
                    </tr>
                  ) : paginatedSales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        …{(s.order_id ?? "").slice(-10)}
                      </td>
                      <td className="px-4 py-3 min-w-36">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {s.payment?.customer_name || "—"}
                        </p>
                        <p className="text-xs text-gray-400">{s.payment?.customer_email || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 max-w-36">
                        <span className="truncate block" title={s.payment?.course_slug}>
                          {s.payment?.course_slug || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {s.payment?.skill_name || s.product_type || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {fmt(s.purchase_amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-500 whitespace-nowrap">
                        {Number(s.discount_amount || 0) > 0 ? `-${fmt(s.discount_amount)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {profile.commission_percentage}%
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-green-600 whitespace-nowrap">
                        {fmt(s.commission_amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(s.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {statusBadge(s.payment_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {(salesPage - 1) * SALES_PER_PAGE + 1}–
                  {Math.min(salesPage * SALES_PER_PAGE, filteredSales.length)} of {filteredSales.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                    disabled={salesPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">{salesPage} / {totalPages}</span>
                  <button
                    onClick={() => setSalesPage(p => Math.min(totalPages, p + 1))}
                    disabled={salesPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Tab: Commissions & Payouts                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "payouts" && (
        <div className="space-y-8">

          {/* Commission History */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-green-600" />Commission History
            </h3>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                      {["Date", "Order ID", "Customer", "Course", "Commission", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sales.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No commissions yet</td></tr>
                    ) : sales.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(s.created_at)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">…{(s.order_id ?? "").slice(-10)}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{s.payment?.customer_name || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-32">
                          <span className="truncate block" title={s.payment?.course_slug}>{s.payment?.course_slug || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-green-600 whitespace-nowrap">{fmt(s.commission_amount)}</td>
                        <td className="px-4 py-3">{statusBadge(s.commission_paid ? "paid" : "pending")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Weekly Payout History */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />Weekly Payout History
            </h3>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                      {["Week", "Eligible Amount", "Paid Amount", "Paid Date", "Transfer ID", "Remarks", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {weeklyPayouts.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-gray-400">No payouts yet</td></tr>
                    ) : weeklyPayouts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {fmtDate(p.week_start)} – {fmtDate(p.week_end)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {fmt(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-green-600 whitespace-nowrap">
                          {p.status === "paid" ? fmt(p.amount) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {p.paid_at ? fmtDate(p.paid_at) : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {p.cashfree_transfer_id || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-36">
                          <span className="truncate block">{p.remarks || "—"}</span>
                        </td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Tab: Withdrawals                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "withdrawals" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                  {["Requested", "Amount", "UPI / Ref", "Notes", "Status", "Last Updated"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-gray-400 text-sm">No withdrawals yet</td>
                  </tr>
                ) : withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(w.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {fmt(w.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {w.upi_id || w.payment_reference || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-40">
                      <span className="truncate block">{w.notes || "—"}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(w.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(w.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Tab: Timeline                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8">
          {timeline.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-4 pb-7 last:pb-0 relative">
                  {i < timeline.length - 1 && (
                    <div className="absolute left-5 top-11 bottom-0 w-px bg-gray-100 dark:bg-gray-800" />
                  )}
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-base shrink-0 relative z-10">
                    {event.icon}
                  </div>
                  <div className="pt-1.5 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{event.desc}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{fmtDateTime(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Edit Modal                                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Edit {editModal.label}</h3>
            <p className="text-xs text-gray-400 mb-4">
              {editModal.field === "commission_percentage" && "Commission % earned per sale. Current: " + profile.commission_percentage + "%"}
              {editModal.field === "discount_value" && `Discount ${profile.discount_type === "flat" ? "(₹ flat)" : "(%)"} given to customers. Current: ${profile.discount_type === "flat" ? "₹" : ""}${profile.discount_value}`}
              {editModal.field === "coupon_code" && "Unique coupon code. Will be uppercased automatically."}
            </p>
            <input
              type={editModal.field === "coupon_code" ? "text" : "number"}
              value={editModal.value}
              onChange={e => setEditModal(m => m ? { ...m, value: e.target.value } : null)}
              onKeyDown={e => e.key === "Enter" && saveEdit()}
              className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
