"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, RotateCcw, ShieldCheck, ShieldOff,
  Wallet, Calendar, RefreshCw, AlertCircle, ChevronDown,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved:   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  paid:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  rejected:   "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function PayoutRow({ payout, onRefresh }: { payout: any; onRefresh: () => void }) {
  const profile = payout.affiliate_profiles ?? {};
  const wallet  = payout.affiliate_wallets ?? {};
  const [processing, setProcessing] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);

  const callAction = async (action: "approve" | "reject" | "retry") => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/affiliates/weekly-payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks: remarks || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          action === "approve" || action === "retry"
            ? `Payout of ${fmt(payout.amount)} transferred successfully!`
            : "Payout rejected"
        );
        setConfirmApprove(false);
        onRefresh();
      } else {
        toast.error(data.error ?? "Action failed");
        onRefresh(); // refresh to show updated status (might be failed)
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setProcessing(false);
    }
  };

  const toggleBankVerify = async (verified: boolean) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/affiliates/bank-verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliate_id: profile.id, verified }),
      });
      if (res.ok) {
        toast.success(verified ? "Bank account verified" : "Verification removed");
        onRefresh();
      } else {
        toast.error("Failed to update verification");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessing(false);
    }
  };

  const hasBankDetails = profile.account_number && profile.ifsc_code && profile.account_holder;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 dark:text-white text-base">{profile.name}</p>
            <span className="text-xs font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
              {profile.coupon_code}
            </span>
            <Badge status={payout.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{fmt(payout.amount)}</p>
          <p className="text-xs text-gray-400">
            {payout.week_start} → {payout.week_end}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-0.5">Wallet Balance</p>
          <p className="font-bold text-gray-900 dark:text-white">{fmt(wallet.available_balance ?? 0)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-0.5">This Payout</p>
          <p className="font-bold text-blue-600">{fmt(payout.amount)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-0.5">Total Earned</p>
          <p className="font-bold text-gray-900 dark:text-white">{fmt(wallet.total_earned ?? 0)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-0.5">Total Paid</p>
          <p className="font-bold text-green-600">{fmt(wallet.total_paid ?? 0)}</p>
        </div>
      </div>

      {/* Bank details */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
        <div className="text-sm">
          {hasBankDetails ? (
            <>
              <p className="font-medium text-gray-900 dark:text-white">
                {profile.account_holder}
                {profile.bank_name ? ` · ${profile.bank_name}` : ""}
              </p>
              <p className="text-gray-500 font-mono text-xs mt-0.5">
                {profile.account_number} · {profile.ifsc_code}
              </p>
              {profile.upi_id && (
                <p className="text-gray-400 text-xs mt-0.5">UPI: {profile.upi_id}</p>
              )}
            </>
          ) : (
            <p className="text-gray-400 italic text-xs">No bank details added</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile.bank_verified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
              <AlertCircle className="w-3.5 h-3.5" /> Unverified
            </span>
          )}
          {hasBankDetails && (
            <button
              onClick={() => toggleBankVerify(!profile.bank_verified)}
              disabled={processing}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                profile.bank_verified
                  ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                  : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
              }`}
            >
              {profile.bank_verified ? (
                <span className="flex items-center gap-1"><ShieldOff className="w-3 h-3" /> Remove</span>
              ) : (
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verify</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Transfer ID (if paid/processing) */}
      {payout.cashfree_transfer_id && (
        <div className="text-xs text-gray-500">
          Transfer ID: <span className="font-mono text-gray-700 dark:text-gray-300">{payout.cashfree_transfer_id}</span>
        </div>
      )}
      {payout.remarks && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2">
          {payout.remarks}
        </div>
      )}

      {/* Action buttons */}
      {payout.status === "pending" && (
        <div className="flex flex-wrap gap-2">
          {!confirmApprove ? (
            <>
              <button
                onClick={() => setConfirmApprove(true)}
                disabled={processing || !profile.bank_verified || !hasBankDetails}
                title={!hasBankDetails ? "Bank details missing" : !profile.bank_verified ? "Bank not verified" : undefined}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Approve & Transfer
              </button>
              <button
                onClick={() => setShowRemarks(r => !r)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Confirm: Transfer {fmt(payout.amount)} to {profile.account_holder}?
                  This will initiate a real bank transfer via Cashfree.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => callAction("approve")}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-60"
                >
                  {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {processing ? "Transferring…" : "Yes, Transfer Now"}
                </button>
                <button
                  onClick={() => setConfirmApprove(false)}
                  disabled={processing}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {payout.status === "failed" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => callAction("retry")}
            disabled={processing || !profile.bank_verified || !hasBankDetails}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {processing ? "Retrying…" : "Retry Transfer"}
          </button>
          <button
            onClick={() => setShowRemarks(r => !r)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      )}

      {/* Reject remarks input */}
      {showRemarks && (
        <div className="flex gap-2 mt-1">
          <input
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={() => callAction("reject")}
            disabled={processing}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            {processing ? "…" : "Confirm Reject"}
          </button>
        </div>
      )}
    </div>
  );
}

const TABS = ["pending", "processing", "paid", "failed", "rejected", "all"] as const;

export default function AdminWeeklyPayoutsPage() {
  const [tab, setTab] = useState<string>("pending");
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliates/weekly-payouts?status=${tab}`);
      if (res.ok) setPayouts((await res.json()).payouts ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const generatePayouts = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/affiliates/weekly-payouts", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Generated ${data.created} payout record${data.created !== 1 ? "s" : ""} for week ${data.week?.start}–${data.week?.end}`);
        load();
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  };

  // Summary totals
  const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalCount = payouts.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Weekly Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve affiliate commission payouts via Cashfree
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={generatePayouts}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            {generating ? "Generating…" : "Generate This Week's Payouts"}
          </button>
        </div>
      </div>

      {/* Summary banner (pending tab) */}
      {tab === "pending" && totalCount > 0 && (
        <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
          <Wallet className="w-8 h-8 text-yellow-600 shrink-0" />
          <div>
            <p className="font-bold text-yellow-800 dark:text-yellow-300 text-lg">
              {fmt(totalPending)} pending across {totalCount} affiliate{totalCount !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Approve to initiate Cashfree bank transfers. Only verified accounts can be paid.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p className="text-gray-400 font-semibold">No {tab === "all" ? "" : tab} payouts</p>
          {tab === "pending" && (
            <p className="text-sm text-gray-400 mt-2">
              Click "Generate This Week's Payouts" or wait for the Sunday cron job.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map(p => (
            <PayoutRow key={p.id} payout={p} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
