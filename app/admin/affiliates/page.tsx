"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Users, Clock, CheckCircle, XCircle, ChevronDown } from "lucide-react";

type Tab = "pending" | "approved" | "rejected" | "all";

const tabDef: { key: Tab; label: string; icon: any; color: string }[] = [
  { key: "all", label: "All", icon: Users, color: "text-gray-600" },
  { key: "pending", label: "Pending", icon: Clock, color: "text-yellow-600" },
  { key: "approved", label: "Approved", icon: CheckCircle, color: "text-green-600" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-600" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function ApplicationRow({ app, onAction }: { app: any; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejReason, setRejReason] = useState("");
  const [commission, setCommission] = useState("50");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("10");

  const act = async (action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/affiliates/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          action,
          rejection_reason: rejReason || undefined,
          commission_percentage: Number(commission),
          discount_type: discountType,
          discount_value: Number(discountValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      if (action === "approve") toast.success(`Approved! Coupon: ${data.coupon}`);
      else toast.success("Application rejected");
      setOpen(false);
      onAction();
    } catch { toast.error("Network error"); }
    finally { setProcessing(false); }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-gray-900 dark:text-white">{app.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[app.status] || ""}`}>{app.status}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{app.email || "—"} · {app.phone} · {new Date(app.created_at).toLocaleDateString("en-IN")}</p>
          {app.college_name && <p className="text-xs text-gray-400">{app.college_name}{app.designation ? ` · ${app.designation}` : ""}</p>}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {app.experience && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Why they want to join</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{app.experience}</p>
            </div>
          )}

          {app.status === "pending" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Commission %</label>
                  <input type="number" value={commission} onChange={e => setCommission(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Discount Value</label>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <input
                value={rejReason}
                onChange={e => setRejReason(e.target.value)}
                placeholder="Rejection reason (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button onClick={() => act("approve")} disabled={processing} className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                  {processing ? "Processing..." : "✓ Approve"}
                </button>
                <button onClick={() => act("reject")} disabled={processing} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                  {processing ? "..." : "✕ Reject"}
                </button>
              </div>
            </div>
          )}

          {app.status !== "pending" && app.rejection_reason && (
            <p className="text-sm text-red-600 dark:text-red-400">Rejection reason: {app.rejection_reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAffiliatesPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliates/applications?status=${tab}`);
      if (res.ok) setApps((await res.json()).applications || []);
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Affiliate Applications</h1>
        <p className="text-gray-500 mt-1">Review and manage affiliate program applications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabDef.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            <t.icon className={`w-4 h-4 ${t.color}`} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="font-semibold">No applications</p></div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => <ApplicationRow key={app.id} app={app} onAction={load} />)}
        </div>
      )}
    </div>
  );
}
