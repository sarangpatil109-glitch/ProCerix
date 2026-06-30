"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function WithdrawalRow({ w, onAction }: { w: any; onAction: () => void }) {
  const [payRef, setPayRef] = useState(w.payment_reference || "");
  const [processing, setProcessing] = useState(false);

  const update = async (status: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/affiliates/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, status, payment_reference: payRef || undefined }),
      });
      if (res.ok) { toast.success(`Status → ${status}`); onAction(); }
      else toast.error("Update failed");
    } catch { toast.error("Network error"); }
    finally { setProcessing(false); }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900 dark:text-white text-lg">₹{Number(w.amount).toFixed(2)}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[w.status] || ""}`}>{w.status}</span>
          </div>
          <p className="text-sm text-gray-500">{w.affiliate_profiles?.name} · {w.affiliate_profiles?.coupon_code}</p>
          <p className="text-xs text-gray-400">{w.upi_id} · {new Date(w.created_at).toLocaleDateString("en-IN")}</p>
        </div>
      </div>
      {w.status === "pending" && (
        <div className="flex gap-2 flex-wrap items-center">
          <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Payment reference (optional)" className="flex-1 min-w-[160px] px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => update("approved")} disabled={processing} className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs disabled:opacity-60">Approve</button>
          <button onClick={() => update("paid")} disabled={processing} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs disabled:opacity-60">Mark Paid</button>
          <button onClick={() => update("rejected")} disabled={processing} className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-xs disabled:opacity-60">Reject</button>
        </div>
      )}
      {w.status === "approved" && (
        <div className="flex gap-2 items-center">
          <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Payment reference" className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => update("paid")} disabled={processing} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs disabled:opacity-60">Mark Paid</button>
        </div>
      )}
      {w.payment_reference && w.status === "paid" && (
        <p className="text-xs text-green-600 font-medium">Ref: {w.payment_reference}</p>
      )}
    </div>
  );
}

export default function AdminAffiliateWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliates/withdrawals?status=${tab}`);
      if (res.ok) setWithdrawals((await res.json()).withdrawals || []);
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Affiliate Withdrawals</h1>
      <div className="flex gap-2">
        {["pending", "approved", "paid", "rejected", "all"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="font-semibold">No withdrawals</p></div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map(w => <WithdrawalRow key={w.id} w={w} onAction={load} />)}
        </div>
      )}
    </div>
  );
}
