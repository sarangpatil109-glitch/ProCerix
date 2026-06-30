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

export default function AffiliateWithdrawPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [wRes, pRes] = await Promise.all([
      fetch("/api/affiliate/withdraw"),
      fetch("/api/affiliate/profile"),
    ]);
    setLoading(true);
    if (wRes.ok) setWithdrawals((await wRes.json()).withdrawals || []);
    if (pRes.ok) {
      const d = await pRes.json();
      setProfile(d.profile);
      setStats(d.stats);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !upiId) { toast.error("Amount and UPI ID required"); return; }
    setRequesting(true);
    try {
      const res = await fetch("/api/affiliate/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), upi_id: upiId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      toast.success("Withdrawal request submitted!");
      setAmount(""); setUpiId(""); setShowForm(false);
      load();
    } catch { toast.error("Network error"); }
    finally { setRequesting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Withdraw</h2>
          <p className="text-gray-500 mt-1">Request a withdrawal of your earned commissions.</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
          {showForm ? "Cancel" : "Request Withdrawal"}
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Earned", value: `₹${(stats?.totalEarned ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
          { label: "Withdrawable Now", value: `₹${(stats?.withdrawable ?? 0).toFixed(2)}`, icon: CheckCircle, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
          { label: "Pending Withdrawal", value: `₹${(stats?.pendingWdAmt ?? 0).toFixed(2)}`, icon: Clock, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" },
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

      {/* Withdraw form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Banknote className="w-5 h-5" /> New Withdrawal Request</h3>
          <form onSubmit={submit} className="space-y-4 max-w-sm">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Amount (₹)</label>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={`Min ₹${500}`}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">UPI ID</label>
              <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Withdrawals are processed within 3–5 business days. Minimum withdrawal amount applies.</span>
            </div>
            <button type="submit" disabled={requesting} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60">
              {requesting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white">Withdrawal History</h3>
        </div>
        {withdrawals.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p className="font-semibold">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {withdrawals.map((w: any) => (
              <div key={w.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">₹{Number(w.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{w.upi_id} · {new Date(w.created_at).toLocaleDateString("en-IN")}</p>
                  {w.payment_reference && <p className="text-xs text-green-600 font-medium">Ref: {w.payment_reference}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[w.status]}`}>{w.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
