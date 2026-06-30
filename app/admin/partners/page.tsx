"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Edit2, Download, Plus, Search, X, QrCode } from "lucide-react";

type Tab = "all" | "pending" | "approved" | "rejected" | "sales" | "withdrawals" | "settings";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ─── Shared form field (module-level — NOT inside another component) ──────────
interface AdminFormFieldProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}

function AdminFormField({ label, value, onChange, type = "text", required = false }: AdminFormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={onChange} required={required}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

// ─── New Partner Modal ───────────────────────────────────────────────────────
function NewPartnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    full_name: "", college_name: "", designation: "", email: "", phone: "",
    upi_id: "", bank_name: "", bank_account_number: "", bank_ifsc: "",
    referral_code: "", commission_percentage: 50, discount_type: "percentage", discount_value: 10, status: "approved",
  });
  const [loading, setLoading] = useState(false);

  const setStr = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const setNum = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: Number(e.target.value) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(data.error || "Failed"); return; }
    toast.success(`Partner created! Code: ${data.partner.referral_code}`);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Partner</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <AdminFormField label="Full Name *" value={form.full_name} onChange={setStr("full_name")} required />
              </div>
              <AdminFormField label="College / Organization" value={form.college_name} onChange={setStr("college_name")} />
              <AdminFormField label="Designation" value={form.designation} onChange={setStr("designation")} />
              <AdminFormField label="Email *" value={form.email} onChange={setStr("email")} type="email" required />
              <AdminFormField label="Phone *" value={form.phone} onChange={setStr("phone")} required />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Coupon & Commission</p>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="Coupon Code (e.g. PATIL50)" value={form.referral_code} onChange={setStr("referral_code")} />
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="approved">Active (Approved)</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Inactive</option>
                </select>
              </div>
              <AdminFormField label="Commission %" value={form.commission_percentage} onChange={setNum("commission_percentage")} type="number" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Discount Type</label>
                <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <AdminFormField label={`Discount Value (${form.discount_type === "flat" ? "₹" : "%"})`} value={form.discount_value} onChange={setNum("discount_value")} type="number" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Details (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="UPI ID" value={form.upi_id} onChange={setStr("upi_id")} />
              <AdminFormField label="Bank Name" value={form.bank_name} onChange={setStr("bank_name")} />
              <AdminFormField label="Account Number" value={form.bank_account_number} onChange={setStr("bank_account_number")} />
              <AdminFormField label="IFSC Code" value={form.bank_ifsc} onChange={setStr("bank_ifsc")} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-70">
            {loading ? "Creating..." : "Create Partner"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── QR Modal ────────────────────────────────────────────────────────────────
function QRModal({ code, name, onClose }: { code: string; name: string; onClose: () => void }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";
  const referralUrl = `${baseUrl}/?ref=${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(referralUrl)}&size=300x300&margin=10`;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{name}</h3>
        <p className="text-blue-600 font-mono font-bold text-xl mb-4">{code}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt={`QR for ${code}`} className="mx-auto rounded-xl border border-gray-200 dark:border-gray-800 mb-4" width={200} height={200} />
        <p className="text-xs text-gray-500 mb-4 break-all">{referralUrl}</p>
        <div className="flex gap-2">
          <a href={qrUrl} download={`${code}-qr.png`} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Download QR</a>
          <button onClick={() => { navigator.clipboard.writeText(referralUrl); toast.success("Link copied!"); }} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Copy Link</button>
        </div>
      </div>
    </div>
  );
}

// ─── Partner Row (with inline editable fields — no nested component) ──────────
function PartnerRow({ p, onAction, onShowQR }: { p: any; onAction: (id: string, payload: any) => void; onShowQR: (p: any) => void }) {
  const [editing, setEditing] = useState<Record<string, string>>({});

  const startEdit = (k: string) => setEditing(e => ({ ...e, [k]: String(p[k] ?? "") }));
  const cancelEdit = (k: string) => setEditing(e => { const n = { ...e }; delete n[k]; return n; });
  const save = async (k: string) => {
    const val = ["commission_percentage", "commission_rate", "discount_value"].includes(k) ? Number(editing[k]) : editing[k];
    await onAction(p.id, { [k]: val });
    cancelEdit(k);
  };

  const codeCell = editing.referral_code !== undefined ? (
    <span className="flex items-center gap-1">
      <input value={editing.referral_code} onChange={e => setEditing(v => ({ ...v, referral_code: e.target.value }))}
        className="w-24 text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono" />
      <button onClick={() => save("referral_code")} className="text-green-600 text-xs font-bold">✓</button>
      <button onClick={() => cancelEdit("referral_code")} className="text-gray-400 text-xs">✗</button>
    </span>
  ) : (
    <span className="flex items-center gap-1 group">
      <span className="font-bold text-blue-600 text-sm font-mono">{p.referral_code}</span>
      <button onClick={() => startEdit("referral_code")} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"><Edit2 className="w-3 h-3" /></button>
    </span>
  );

  const commCell = editing.commission_percentage !== undefined ? (
    <span className="flex items-center gap-1">
      <input value={editing.commission_percentage} onChange={e => setEditing(v => ({ ...v, commission_percentage: e.target.value }))}
        className="w-16 text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
      <button onClick={() => save("commission_percentage")} className="text-green-600 text-xs font-bold">✓</button>
      <button onClick={() => cancelEdit("commission_percentage")} className="text-gray-400 text-xs">✗</button>
    </span>
  ) : (
    <span className="flex items-center gap-1 group">
      <span className="text-xs">{p.commission_percentage ?? p.commission_rate ?? 50}%</span>
      <button onClick={() => startEdit("commission_percentage")} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"><Edit2 className="w-3 h-3" /></button>
    </span>
  );

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 dark:text-white text-sm">{p.full_name}</p>
        <p className="text-xs text-gray-500">{p.email}</p>
        {p.college_name && <p className="text-xs text-gray-400">{p.college_name}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.phone}</td>
      <td className="px-4 py-3 font-mono">{codeCell}</td>
      <td className="px-4 py-3">{commCell}</td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {p.discount_type === "flat" ? `₹${p.discount_value} flat` : `${p.discount_value}% off`}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status] || "bg-gray-100 text-gray-700"}`}>{p.status}</span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => onShowQR(p)} title="QR Code" className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"><QrCode className="w-4 h-4" /></button>
          {p.status !== "approved" && <button onClick={() => onAction(p.id, { status: "approved" })} title="Approve" className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"><CheckCircle className="w-4 h-4" /></button>}
          {p.status !== "rejected" && <button onClick={() => onAction(p.id, { status: "rejected" })} title="Reject" className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"><XCircle className="w-4 h-4" /></button>}
        </div>
      </td>
    </tr>
  );
}

// ─── Withdrawal Row ───────────────────────────────────────────────────────────
function WithdrawalRow({ w, onAction }: { w: any; onAction: (id: string, status: string, ref?: string, table?: string) => void }) {
  const [payRef, setPayRef] = useState("");
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <td className="px-4 py-3"><p className="font-medium text-sm">{w.partners?.full_name}</p><p className="text-xs text-gray-500">{w.partners?.email}</p></td>
      <td className="px-4 py-3 font-bold">₹{Number(w.amount).toFixed(2)}</td>
      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[w.status] || "bg-gray-100 text-gray-700"}`}>{w.status}</span></td>
      <td className="px-4 py-3 text-xs text-gray-500"><div>UPI: {w.upi_id || "—"}</div><div>Bank: {w.bank_name || "—"}</div></td>
      <td className="px-4 py-3 text-xs text-gray-500">{new Date(w.requested_at || w.created_at).toLocaleDateString("en-IN")}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {w.status === "pending" && <button onClick={() => onAction(w.id, "approved", undefined, w._table)} className="px-2 py-1 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium">Approve</button>}
          {w.status === "approved" && (
            <>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Ref#" className="text-xs border border-gray-200 rounded px-2 py-1 w-20 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" />
              <button onClick={() => onAction(w.id, "paid", payRef, w._table)} className="px-2 py-1 text-xs rounded-lg bg-green-50 hover:bg-green-100 text-green-600 font-medium">Mark Paid</button>
            </>
          )}
          {!["rejected", "paid"].includes(w.status) && <button onClick={() => onAction(w.id, "rejected", undefined, w._table)} className="px-2 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium">Reject</button>}
        </div>
      </td>
    </tr>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel() {
  const [s, setS] = useState({ default_commission_rate: 50, min_withdrawal_amount: 500, auto_approval: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetch("/api/admin/partners/settings").then(r => r.json()).then(d => d.settings && setS(d.settings)); }, []);
  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/partners/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setSaving(false);
    if (res.ok) toast.success("Settings saved"); else toast.error("Failed");
  };
  return (
    <div className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 space-y-5">
      <h3 className="font-bold text-gray-900 dark:text-white">Global Settings</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Commission Rate (%)</label>
        <input type="number" value={s.default_commission_rate} onChange={e => setS(x => ({ ...x, default_commission_rate: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Withdrawal Amount (₹)</label>
        <input type="number" value={s.min_withdrawal_amount} onChange={e => setS(x => ({ ...x, min_withdrawal_amount: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="auto" checked={s.auto_approval} onChange={e => setS(x => ({ ...x, auto_approval: e.target.checked }))} className="w-4 h-4 rounded" />
        <label htmlFor="auto" className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-approve new partner registrations</label>
      </div>
      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-70">
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPartnersPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [partners, setPartners] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [qrPartner, setQrPartner] = useState<any>(null);
  const [search, setSearch] = useState("");

  const loadPartners = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const params = new URLSearchParams();
    const status = tab === "all" ? "" : tab;
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/partners?${params}`);
    if (res.ok) setPartners((await res.json()).partners || []);
    setLoading(false);
  }, [tab, search]);

  const loadSales = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const res = await fetch("/api/admin/partners/sales");
    if (res.ok) setSales((await res.json()).sales || []);
    setLoading(false);
  }, []);

  const loadWithdrawals = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const res = await fetch("/api/admin/partners/withdrawals");
    if (res.ok) setWithdrawals((await res.json()).withdrawals || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "sales") loadSales();
    else if (tab === "withdrawals") loadWithdrawals();
    else if (tab !== "settings") loadPartners();
  }, [tab, loadPartners, loadSales, loadWithdrawals]);

  useEffect(() => {
    if (tab !== "sales" && tab !== "withdrawals" && tab !== "settings") loadPartners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePartnerAction = async (id: string, payload: any) => {
    const res = await fetch(`/api/admin/partners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success("Updated"); loadPartners(); } else toast.error("Failed");
  };

  const handleWithdrawalAction = async (id: string, status: string, ref?: string, _table?: string) => {
    const res = await fetch("/api/admin/partners/withdrawals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, payment_reference: ref, _table }) });
    if (res.ok) { toast.success(`Withdrawal ${status}`); loadWithdrawals(); } else toast.error("Failed");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All Partners" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Inactive" },
    { key: "sales", label: "Sales" },
    { key: "withdrawals", label: "Withdrawals" },
    { key: "settings", label: "Settings" },
  ];

  const exportTypes = ["partners", "sales", "withdrawals"] as const;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {showNew && <NewPartnerModal onClose={() => setShowNew(false)} onCreated={loadPartners} />}
      {qrPartner && <QRModal code={qrPartner.referral_code} name={qrPartner.full_name} onClose={() => setQrPartner(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Partner Management</h2>
          <p className="text-gray-500 mt-1">Manage teacher affiliates, coupons, commissions, and withdrawals.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {exportTypes.map(t => (
            <a key={t} href={`/api/admin/partners/export?type=${t}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download className="w-3.5 h-3.5" /> {t}
            </a>
          ))}
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Partner
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search (for partner tabs) */}
      {!["sales", "withdrawals", "settings"].includes(tab) && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partner, code, college..." className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {/* Content */}
      {tab === "settings" ? <SettingsPanel /> : tab === "sales" ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : sales.length === 0 ? <div className="py-12 text-center text-gray-500">No sales recorded yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  {["Partner", "Coupon", "Product", "Sale Amount", "Discount", "Commission", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sales.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white text-sm">{s.partners?.full_name}</p><p className="text-xs text-gray-500">{s.partners?.email}</p></td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 text-sm">{s.coupon_code}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.product_type}</td>
                      <td className="px-4 py-3 font-medium">₹{Number(s.purchase_amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-orange-600">-₹{Number(s.discount_amount).toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold text-green-600">+₹{Number(s.commission_amount).toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[s.payment_status] || "bg-gray-100 text-gray-700"}`}>{s.payment_status}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === "withdrawals" ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : withdrawals.length === 0 ? <div className="py-12 text-center text-gray-500">No withdrawal requests.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  {["Partner", "Amount", "Status", "UPI/Bank", "Requested", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>{withdrawals.map((w: any) => <WithdrawalRow key={w.id} w={w} onAction={handleWithdrawalAction} />)}</tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : partners.length === 0 ? <div className="py-12 text-center text-gray-500">No partners found. Click &quot;New Partner&quot; to add one.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  {["Partner", "Phone", "Coupon Code", "Commission", "Discount", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>{partners.map((p: any) => <PartnerRow key={p.id} p={p} onAction={handlePartnerAction} onShowQR={setQrPartner} />)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
