"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User, Shield, Bell, Palette, Lock, Plug, CreditCard,
  HelpCircle, AlertTriangle, Camera, Loader2, Upload,
  Eye, EyeOff, ChevronRight, LogOut, Trash2, ExternalLink,
  Mail, MessageCircle, FileText, CheckCircle2, Briefcase,
  GitBranch, Globe, Phone,
} from "lucide-react";
import {
  updateAccountAction,
  updateAppearanceAction,
  updatePrivacyAction,
} from "@/actions/settings";
import {
  updatePasswordAction,
  updateNotificationsAction,
  logoutAction,
  deleteAccountAction,
} from "@/actions/profile";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SettingsData {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  mobile?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
  language?: string | null;
  theme?: string | null;
  accent_color?: string | null;
  public_profile?: boolean | null;
  show_linkedin?: boolean | null;
  show_portfolio?: boolean | null;
  receive_product_updates?: boolean | null;
  notif_email?: boolean | null;
  notif_purchases?: boolean | null;
  notif_certificates?: boolean | null;
  notif_internships?: boolean | null;
  notif_affiliate_payout?: boolean | null;
  notif_marketing?: boolean | null;
}

export interface BillingStats {
  totalPurchases: number;
  certificates: number;
  internships: number;
  affiliateEarnings: number;
  isAffiliate: boolean;
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

const inputCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const readonlyCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-500 cursor-not-allowed flex items-center";
const selectCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none";

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SectionCard({ id, icon: Icon, title, description, badge, children, footer }: {
  id: string; icon: React.ElementType; title: string; description: string;
  badge?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden scroll-mt-6">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" style={{ width: "1.125rem", height: "1.125rem" }} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
        {badge}
      </div>
      <div className="p-6 space-y-5">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function SaveButton({ saving, label = "Save Changes", disabled }: { saving: boolean; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={saving || disabled}
      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {label}
    </button>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

// ─── Section 1: Account ────────────────────────────────────────────────────────

function AccountSection({ data, email }: { data: SettingsData; email: string }) {
  const [form, setForm] = useState({
    first_name: data.first_name ?? "",
    last_name:  data.last_name  ?? "",
    mobile:     data.mobile     ?? "",
    country:    data.country    ?? "",
    state:      data.state      ?? "",
    city:       data.city       ?? "",
    timezone:   data.timezone   ?? "",
    language:   data.language   ?? "en",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(data.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setDirty(true);
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (form.mobile && !/^\+?[0-9\s\-()]{7,15}$/.test(form.mobile)) e.mobile = "Invalid phone number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const r = await updateAccountAction(form);
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Account settings saved.");
    setDirty(false);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const d = await res.json();
    setUploading(false);
    if (!res.ok) { toast.error(d.error ?? "Upload failed"); return; }
    setAvatarUrl(d.avatarUrl);
    toast.success("Profile photo updated.");
  };

  const removeAvatar = async () => {
    setUploading(true);
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    setUploading(false);
    if (!res.ok) { toast.error("Failed to remove photo"); return; }
    setAvatarUrl("");
    toast.success("Profile photo removed.");
  };

  return (
    <SectionCard
      id="account" icon={User}
      title="Account" description="Your basic profile and contact details."
      footer={
        <>
          {dirty && (
            <button onClick={() => { setForm({ first_name: data.first_name ?? "", last_name: data.last_name ?? "", mobile: data.mobile ?? "", country: data.country ?? "", state: data.state ?? "", city: data.city ?? "", timezone: data.timezone ?? "", language: data.language ?? "en" }); setErrors({}); setDirty(false); }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          )}
          <div onClick={onSave}><SaveButton saving={saving} /></div>
        </>
      }
    >
      {/* Avatar */}
      <div className="flex items-center gap-5 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="relative group shrink-0">
          <div className="w-18 h-18 w-[72px] h-[72px] rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-md">
            {uploading ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> :
              avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> :
              <User className="w-7 h-7 text-blue-400" />}
          </div>
          {!uploading && (
            <button onClick={() => fileRef.current?.click()} className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }} />
        <div className="space-y-2">
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
              <Upload className="w-3.5 h-3.5" />{avatarUrl ? "Replace" : "Upload Photo"}
            </button>
            {avatarUrl && (
              <button onClick={removeAvatar} disabled={uploading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 5 MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" error={errors.first_name}>
          <input value={form.first_name} onChange={set("first_name")} placeholder="First name" className={inputCls} />
        </Field>
        <Field label="Last Name">
          <input value={form.last_name} onChange={set("last_name")} placeholder="Last name" className={inputCls} />
        </Field>
      </div>
      <Field label="Email Address" hint="Email cannot be changed. Contact support if needed.">
        <div className={readonlyCls}>{email}</div>
      </Field>
      <Field label="Phone Number" error={errors.mobile}>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={form.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" className={inputCls + " pl-9"} />
        </div>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Country">
          <input value={form.country} onChange={set("country")} placeholder="India" className={inputCls} />
        </Field>
        <Field label="State">
          <input value={form.state} onChange={set("state")} placeholder="Maharashtra" className={inputCls} />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={set("city")} placeholder="Mumbai" className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Timezone">
          <select value={form.timezone} onChange={set("timezone")} className={selectCls}>
            <option value="">Select timezone</option>
            <option value="Asia/Kolkata">India (IST, UTC+5:30)</option>
            <option value="America/New_York">New York (EST, UTC-5)</option>
            <option value="America/Los_Angeles">Los Angeles (PST, UTC-8)</option>
            <option value="Europe/London">London (GMT, UTC+0)</option>
            <option value="Europe/Paris">Paris (CET, UTC+1)</option>
            <option value="Asia/Dubai">Dubai (GST, UTC+4)</option>
            <option value="Asia/Singapore">Singapore (SGT, UTC+8)</option>
            <option value="Asia/Tokyo">Tokyo (JST, UTC+9)</option>
            <option value="Australia/Sydney">Sydney (AEDT, UTC+11)</option>
          </select>
        </Field>
        <Field label="Language">
          <select value={form.language} onChange={set("language")} className={selectCls}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="gu">Gujarati</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="bn">Bengali</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
          </select>
        </Field>
      </div>
    </SectionCard>
  );
}

// ─── Section 2: Security ───────────────────────────────────────────────────────

function SecuritySection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.currentPassword)        e.currentPassword = "Current password is required";
    if (form.newPassword.length < 8)  e.newPassword     = "Minimum 8 characters";
    if (!form.confirmPassword)        e.confirmPassword = "Please confirm your password";
    if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const r = await updatePasswordAction(form);
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Password updated successfully.");
    setOpen(false);
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <SectionCard id="security" icon={Shield} title="Security" description="Manage your account password and access.">
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Password</p>
          <p className="text-sm text-gray-400 tracking-widest mt-0.5">••••••••••</p>
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors">
          <Lock className="w-3.5 h-3.5" />{open ? "Cancel" : "Change Password"}
        </button>
      </div>

      {open && (
        <div className="space-y-4 p-5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10">
          <Field label="Current Password" error={errors.currentPassword}>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={form.currentPassword} onChange={set("currentPassword")} placeholder="Enter current password" className={inputCls + " pr-11"} />
              <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="New Password" error={errors.newPassword}>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={form.newPassword} onChange={set("newPassword")} placeholder="Minimum 8 characters" className={inputCls + " pr-11"} />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm New Password" error={errors.confirmPassword}>
            <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter new password" className={inputCls} />
          </Field>
          <div className="flex justify-end pt-1">
            <div onClick={onSave}><SaveButton saving={saving} label="Update Password" /></div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section 3: Notifications ─────────────────────────────────────────────────

function NotificationsSection({ data }: { data: SettingsData }) {
  const [prefs, setPrefs] = useState({
    notif_email:            data.notif_email            ?? true,
    notif_purchases:        data.notif_purchases        ?? true,
    notif_certificates:     data.notif_certificates     ?? true,
    notif_internships:      data.notif_internships      ?? true,
    notif_affiliate_payout: data.notif_affiliate_payout ?? true,
    notif_marketing:        data.notif_marketing        ?? false,
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    const r = await updateNotificationsAction(prefs);
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Notification preferences saved.");
  };

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "notif_email",            label: "Email Notifications",       desc: "Receive important account emails."            },
    { key: "notif_purchases",        label: "Course Updates",            desc: "Updates on courses you are enrolled in."      },
    { key: "notif_certificates",     label: "Certificate Notifications", desc: "When your certificate is ready to download."  },
    { key: "notif_internships",      label: "Internship Notifications",  desc: "Tasks, progress, and internship status."      },
    { key: "notif_affiliate_payout", label: "Affiliate Notifications",   desc: "Payout processing and transfer alerts."       },
    { key: "notif_marketing",        label: "Marketing Emails",          desc: "Promotions, offers, and product launches."    },
  ];

  return (
    <SectionCard id="notifications" icon={Bell} title="Notifications" description="Choose which emails you receive."
      footer={<div onClick={onSave}><SaveButton saving={saving} label="Save Preferences" /></div>}
    >
      <div>
        {items.map(i => (
          <Toggle key={i.key} checked={prefs[i.key]} onChange={v => setPrefs(p => ({ ...p, [i.key]: v }))} label={i.label} description={i.desc} />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section 4: Appearance ────────────────────────────────────────────────────

const ACCENTS = [
  { value: "blue",   label: "Blue",   ring: "ring-blue-500",   bg: "bg-blue-500"   },
  { value: "purple", label: "Purple", ring: "ring-purple-500", bg: "bg-purple-500" },
  { value: "green",  label: "Green",  ring: "ring-green-500",  bg: "bg-green-500"  },
  { value: "orange", label: "Orange", ring: "ring-orange-500", bg: "bg-orange-500" },
];

function AppearanceSection({ data }: { data: SettingsData }) {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState(data.accent_color ?? "blue");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = mounted ? (theme ?? "system") : (data.theme ?? "system");

  const onSave = async () => {
    setSaving(true);
    const r = await updateAppearanceAction({ theme: currentTheme, accent_color: accent });
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Appearance preferences saved.");
  };

  return (
    <SectionCard id="appearance" icon={Palette} title="Appearance" description="Customize how ProCerix looks for you."
      footer={<div onClick={onSave}><SaveButton saving={saving} label="Save Theme" /></div>}
    >
      {/* Theme */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map(t => (
            <button key={t} onClick={() => setTheme(t)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${currentTheme === t ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
              {/* Mini preview */}
              <div className={`w-full h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex ${t === "dark" ? "bg-gray-900" : t === "light" ? "bg-white" : "bg-gradient-to-r from-white to-gray-900"}`}>
                <div className={`w-1/3 h-full ${t === "dark" ? "bg-gray-800" : t === "light" ? "bg-gray-100" : "bg-gray-200"}`} />
              </div>
              <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">{t === "system" ? "System" : t === "light" ? "Light" : "Dark"}</span>
              {currentTheme === t && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Accent Color</p>
        <div className="flex gap-3">
          {ACCENTS.map(a => (
            <button key={a.value} onClick={() => setAccent(a.value)}
              className={`flex flex-col items-center gap-2 transition-all`}>
              <div className={`w-9 h-9 rounded-full ${a.bg} transition-all ${accent === a.value ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${a.ring} scale-110` : "opacity-70 hover:opacity-100 hover:scale-105"}`} />
              <span className={`text-xs font-medium transition-colors ${accent === a.value ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section 5: Privacy ───────────────────────────────────────────────────────

function PrivacySection({ data }: { data: SettingsData }) {
  const [prefs, setPrefs] = useState({
    public_profile:          data.public_profile          ?? true,
    show_linkedin:           data.show_linkedin           ?? true,
    show_portfolio:          data.show_portfolio          ?? true,
    receive_product_updates: data.receive_product_updates ?? true,
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    const r = await updatePrivacyAction(prefs);
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success("Privacy settings saved.");
  };

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "public_profile",          label: "Public Profile",           desc: "Allow others to view your profile page."       },
    { key: "show_linkedin",           label: "Show LinkedIn",            desc: "Display your LinkedIn on your public profile." },
    { key: "show_portfolio",          label: "Show Portfolio",           desc: "Display your portfolio website publicly."      },
    { key: "receive_product_updates", label: "Receive Product Updates",  desc: "Get notified about new features and courses."  },
  ];

  return (
    <SectionCard id="privacy" icon={Lock} title="Privacy" description="Control your data and profile visibility."
      footer={<div onClick={onSave}><SaveButton saving={saving} label="Save Privacy Settings" /></div>}
    >
      <div>
        {items.map(i => (
          <Toggle key={i.key} checked={prefs[i.key]} onChange={v => setPrefs(p => ({ ...p, [i.key]: v }))} label={i.label} description={i.desc} />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section 6: Connected Accounts ───────────────────────────────────────────

function ConnectedSection() {
  const providers = [
    { name: "Google",   icon: Globe,   description: "Sign in with your Google account" },
    { name: "GitHub",   icon: GitBranch, description: "Link your GitHub profile"        },
    { name: "LinkedIn", icon: Briefcase, description: "Import your LinkedIn profile"    },
  ];

  return (
    <SectionCard id="connected" icon={Plug} title="Connected Accounts" description="Link external accounts for quick sign-in.">
      <div className="space-y-3">
        {providers.map(p => (
          <div key={p.name} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                <p.icon className="w-4.5 h-4.5 text-gray-500" style={{ width: "1.125rem", height: "1.125rem" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-gray-400">{p.description}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">Coming Soon</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section 7: Billing ───────────────────────────────────────────────────────

function BillingSection({ stats }: { stats: BillingStats }) {
  const items = [
    { label: "Total Purchases",    value: stats.totalPurchases, icon: CreditCard,   color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-900/20"    },
    { label: "Certificates",       value: stats.certificates,   icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20"  },
    { label: "Internships",        value: stats.internships,    icon: Briefcase,    color: "text-purple-500",bg: "bg-purple-50 dark:bg-purple-900/20" },
    {
      label: stats.isAffiliate ? "Affiliate Earnings" : "Affiliate",
      value: stats.isAffiliate ? `₹${stats.affiliateEarnings.toFixed(0)}` : "—",
      icon: User, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <SectionCard id="billing" icon={CreditCard} title="Billing" description="Summary of your purchases and earnings.">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">Payment methods and invoices are not yet available in this release.</p>
    </SectionCard>
  );
}

// ─── Section 8: Support ───────────────────────────────────────────────────────

function SupportSection() {
  const links = [
    { label: "Contact Support",  icon: Mail,          href: "mailto:support@procerix.com",  external: true  },
    { label: "WhatsApp Support", icon: MessageCircle, href: "https://wa.me/918888888888",   external: true  },
    { label: "Privacy Policy",   icon: FileText,      href: "/privacy",                     external: false },
    { label: "Terms & Conditions", icon: FileText,    href: "/terms",                       external: false },
    { label: "Refund Policy",    icon: FileText,      href: "/refund-policy",               external: false },
  ];

  return (
    <SectionCard id="support" icon={HelpCircle} title="Support" description="Get help or review our policies.">
      <div className="space-y-2">
        {links.map(l => (
          <a key={l.label} href={l.href} target={l.external ? "_blank" : undefined} rel={l.external ? "noopener noreferrer" : undefined}
            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 group transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <l.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{l.label}</span>
            </div>
            <ExternalLink className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors ${l.external ? "" : "opacity-0"}`} />
          </a>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section 9: Danger Zone ───────────────────────────────────────────────────

function DangerSection() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");

  const onLogout = async () => {
    setLoggingOut(true);
    const r = await logoutAction();
    if (r.error) { toast.error(r.error); setLoggingOut(false); return; }
    router.push("/login");
  };

  const onDelete = async () => {
    if (confirm !== "DELETE") { toast.error('Type "DELETE" to confirm'); return; }
    setDeleting(true);
    const r = await deleteAccountAction();
    if (r.error) { toast.error(r.error); setDeleting(false); return; }
    toast.success("Account deleted.");
    router.push("/");
  };

  return (
    <SectionCard id="danger" icon={AlertTriangle} title="Danger Zone" description="Irreversible account actions.">
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Sign Out</p>
          <p className="text-xs text-gray-400 mt-0.5">Log out from your account on this device.</p>
        </div>
        <button onClick={onLogout} disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-60">
          {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Log Out
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Account</p>
          <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5">Permanently deletes all data. Cannot be undone.</p>
        </div>
        <button onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete Account
        </button>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Delete Account?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This is permanent and cannot be reversed.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">All your purchases, certificates, and data will be permanently deleted.</p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500">Type <span className="font-mono text-red-500">DELETE</span> to confirm</p>
              <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" className={inputCls} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setDeleteOpen(false); setConfirm(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={onDelete} disabled={deleting || confirm !== "DELETE"}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Sidebar nav ───────────────────────────────────────────────────────────────

const NAV = [
  { id: "account",       label: "Account",            icon: User          },
  { id: "security",      label: "Security",           icon: Shield        },
  { id: "notifications", label: "Notifications",      icon: Bell          },
  { id: "appearance",    label: "Appearance",         icon: Palette       },
  { id: "privacy",       label: "Privacy",            icon: Lock          },
  { id: "connected",     label: "Connected Accounts", icon: Plug          },
  { id: "billing",       label: "Billing",            icon: CreditCard    },
  { id: "support",       label: "Support",            icon: HelpCircle    },
  { id: "danger",        label: "Danger Zone",        icon: AlertTriangle },
];

// ─── Main export ───────────────────────────────────────────────────────────────

export function SettingsClient({
  data, email, billingStats,
}: {
  data: SettingsData;
  email: string;
  billingStats: BillingStats;
}) {
  const [active, setActive] = useState("account");

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => { for (const e of entries) { if (e.isIntersecting) setActive(e.target.id); } },
      { threshold: 0.2, rootMargin: "-80px 0px -55% 0px" },
    );
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your account, security, and preferences.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
          <nav className="space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${active === id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active === id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile horizontal tabs */}
        <div className="lg:hidden -mx-4 px-4 mb-6 overflow-x-auto w-full">
          <div className="flex gap-2 w-max pb-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active === id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 min-w-0 space-y-6">
          <AccountSection data={data} email={email} />
          <SecuritySection />
          <NotificationsSection data={data} />
          <AppearanceSection data={data} />
          <PrivacySection data={data} />
          <ConnectedSection />
          <BillingSection stats={billingStats} />
          <SupportSection />
          <DangerSection />
        </div>
      </div>
    </div>
  );
}
