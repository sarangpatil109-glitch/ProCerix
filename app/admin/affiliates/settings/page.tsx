"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";

export default function AdminAffiliateSettingsPage() {
  const [settings, setSettings] = useState({
    default_commission_percentage: 50,
    default_discount_type: "percentage",
    default_discount_value: 10,
    minimum_withdrawal: 500,
    coupon_expiry_days: "",
    coupon_usage_limit: "",
    auto_approve: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/affiliates/settings").then(r => r.json()).then(d => {
      if (d.settings) {
        setSettings(s => ({
          ...s,
          ...d.settings,
          coupon_expiry_days: d.settings.coupon_expiry_days ?? "",
          coupon_usage_limit: d.settings.coupon_usage_limit ?? "",
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/affiliates/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          coupon_expiry_days: settings.coupon_expiry_days ? Number(settings.coupon_expiry_days) : null,
          coupon_usage_limit: settings.coupon_usage_limit ? Number(settings.coupon_usage_limit) : null,
        }),
      });
      if (res.ok) toast.success("Settings saved!");
      else toast.error("Failed to save");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings(s => ({ ...s, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const fields = [
    { label: "Default Commission %", key: "default_commission_percentage", type: "number", placeholder: "50" },
    { label: "Default Discount Type", key: "default_discount_type", type: "select", options: [{ value: "percentage", label: "Percentage" }, { value: "flat", label: "Flat (₹)" }] },
    { label: "Default Discount Value", key: "default_discount_value", type: "number", placeholder: "10" },
    { label: "Minimum Withdrawal (₹)", key: "minimum_withdrawal", type: "number", placeholder: "500" },
    { label: "Coupon Expiry (days)", key: "coupon_expiry_days", type: "number", placeholder: "Leave blank for no expiry" },
    { label: "Coupon Usage Limit", key: "coupon_usage_limit", type: "number", placeholder: "Leave blank for unlimited" },
  ];

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Affiliate Settings</h1>
        <p className="text-gray-500 mt-1">Default values applied when approving new affiliates.</p>
      </div>

      <form onSubmit={save} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
            {f.type === "select" ? (
              <select value={(settings as any)[f.key]} onChange={set(f.key)} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {f.options!.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input type="number" value={(settings as any)[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="auto_approve" checked={settings.auto_approve} onChange={set("auto_approve")} className="w-4 h-4 rounded border-gray-300" />
          <label htmlFor="auto_approve" className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-approve applications instantly</label>
        </div>
        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-60 transition-colors">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
