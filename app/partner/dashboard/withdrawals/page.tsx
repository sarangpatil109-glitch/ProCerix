"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { DollarSign, Clock, CheckCircle, Banknote, AlertCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function PartnerWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [reqAmount, setReqAmount] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [wRes, dRes] = await Promise.all([fetch("/api/partner/withdraw"), fetch("/api/partner/dashboard")]);
    setLoading(true);
    if (wRes.ok) setWithdrawals((await wRes.json()).withdrawals || []);
    if (dRes.ok) setStats((await dRes.json()).stats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const requestWithdrawal = async () => {
    setRequesting(true);
    const body: Record<string, number> = {};
    if (reqAmount) body.amount = parseFloat(reqAmount);
    const res = await fetch("/api/partner/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setRequesting(false);
    if (!res.ok) { toast.error(data.error || "Request failed"); return; }
    toast.success("Withdrawal request submitted!");
    setShowForm(false);
    setReqAmount("");
    load();
  };

  const withdrawable = stats?.withdrawable_balance ?? 0;
  const total = stats?.total_commission ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Withdrawals</h2>
          <p className="text-gray-500 mt-1">Request payouts to your registered UPI or bank account.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} disabled={withdrawable <= 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <DollarSign className="w-4 h-4" /> Request Withdrawal
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Earned", value: `₹${Number(total).toFixed(2)}`, icon: CheckCircle, color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
          { label: "Withdrawable Now", value: `₹${Number(withdrawable).toFixed(2)}`, icon: Banknote, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
          { label: "Pending Withdrawal", value: `₹${Number(stats?.pending_withdrawal ?? 0).toFixed(2)}`, icon: Clock, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Request form */}
      {showForm && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">New Withdrawal Request</h3>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Withdrawable balance: <strong>₹{Number(withdrawable).toFixed(2)}</strong>. Payment will be processed within 3–5 business days.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Amount (₹) — leave blank for full balance</label>
              <input type="number" value={reqAmount} onChange={e => setReqAmount(e.target.value)}
                placeholder={`Max ₹${Number(withdrawable).toFixed(2)}`} max={withdrawable} min={1} step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={requestWithdrawal} disabled={requesting}
              className="self-end px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-70">
              {requesting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white">Withdrawal History</h3>
        </div>
        {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No withdrawal requests yet. Earn commissions and come back here to withdraw!</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {withdrawals.map((w: any) => (
              <div key={w.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">₹{Number(w.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Requested {new Date(w.requested_at || w.created_at).toLocaleDateString("en-IN")}</p>
                  {w.payment_reference && <p className="text-xs text-gray-400 mt-0.5">Ref: {w.payment_reference}</p>}
                  {w.rejection_reason && <p className="text-xs text-red-500 mt-0.5">{w.rejection_reason}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[w.status] || "bg-gray-100 text-gray-700"}`}>{w.status}</span>
                  {w.paid_at && <p className="text-xs text-gray-400 mt-1">Paid {new Date(w.paid_at).toLocaleDateString("en-IN")}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
