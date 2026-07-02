"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Award, Shield, QrCode, Image as ImageIcon } from "lucide-react";

interface Props {
  course: any;
  onUpdate: (updated: any) => void;
}

export function CertificateSettings({ course, onUpdate }: Props) {
  const [form, setForm] = useState({
    certificate_template: course.certificate_template || "default",
    validity_period: course.validity_period || "lifetime",
    passing_percentage: String(course.passing_percentage || 70),
    badge_url: course.badge_url || "",
    auto_issue_certificate: course.auto_issue_certificate !== false,
    qr_verification: course.qr_verification !== false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_COURSE_INFO",
          id: course.id,
          ...form,
          passing_percentage: parseInt(form.passing_percentage) || 70,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data);
      toast.success("Certificate settings saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const TEMPLATES = [
    { value: "default", label: "Default", description: "Clean, professional layout" },
    { value: "premium", label: "Premium", description: "Gold bordered, elegant" },
    { value: "modern", label: "Modern", description: "Minimalist, flat design" },
    { value: "corporate", label: "Corporate", description: "Formal business style" },
  ];

  const VALIDITY = [
    { value: "lifetime", label: "Lifetime (Never expires)" },
    { value: "1_year", label: "1 Year" },
    { value: "2_years", label: "2 Years" },
    { value: "3_years", label: "3 Years" },
    { value: "5_years", label: "5 Years" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Certificate Settings</h3>
          <p className="text-sm text-gray-500 mt-0.5">Configure how certificates are issued for this course</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20"
        >
          <Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Template */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Certificate Template</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("certificate_template", t.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${form.certificate_template === t.value ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
            >
              <div className={`w-full h-16 rounded-lg mb-3 flex items-center justify-center text-2xl ${
                t.value === "default" ? "bg-blue-50 dark:bg-blue-900/20" :
                t.value === "premium" ? "bg-amber-50 dark:bg-amber-900/20" :
                t.value === "modern" ? "bg-gray-50 dark:bg-gray-800" :
                "bg-indigo-50 dark:bg-indigo-900/20"
              }`}>
                🏆
              </div>
              <p className={`font-bold text-sm ${form.certificate_template === t.value ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}>{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Configuration</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Validity Period</label>
            <select
              value={form.validity_period}
              onChange={(e) => set("validity_period", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VALIDITY.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Passing Percentage (%)</label>
            <input
              type="number" min="1" max="100"
              value={form.passing_percentage}
              onChange={(e) => set("passing_percentage", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="70"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />Badge / Logo URL
          </label>
          <input
            type="url"
            value={form.badge_url}
            onChange={(e) => set("badge_url", e.target.value)}
            placeholder="https://... (optional)"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.badge_url && (
            <img src={form.badge_url} alt="Badge" className="w-20 h-20 object-contain rounded-xl border border-gray-200 mt-2" />
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Automation</h4>

        {[
          {
            key: "auto_issue_certificate",
            icon: Award,
            title: "Auto-issue Certificate",
            desc: "Automatically issue certificate when student passes the quiz",
          },
          {
            key: "qr_verification",
            icon: QrCode,
            title: "QR Code Verification",
            desc: "Include a scannable QR code for certificate authenticity",
          },
        ].map(({ key, icon: Icon, title, desc }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set(key, !(form as any)[key])}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${(form as any)[key] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
              style={{ height: "22px", width: "40px" }}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(form as any)[key] ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">All certificates are stored in the database and verifiable at <strong>/verify/[credential-id]</strong></p>
        </div>
      </div>
    </div>
  );
}
