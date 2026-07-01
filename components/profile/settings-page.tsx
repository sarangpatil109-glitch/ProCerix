"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  User, Briefcase, Shield, ShoppingBag, Landmark, Bell, AlertTriangle,
  Camera, Trash2, Upload, FileText, Eye, EyeOff, Loader2,
  CheckCircle2, LogOut, X, ChevronRight, ExternalLink,
  GitBranch, Link2, Globe, Building2, GraduationCap,
} from "lucide-react";
import {
  updatePersonalInfoAction,
  updateProfessionalInfoAction,
  updatePasswordAction,
  updateNotificationsAction,
  logoutAction,
  deleteAccountAction,
} from "@/actions/profile";
import { BankDetailsForm } from "@/components/affiliate/bank-details-form";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileData {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  mobile?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  pincode?: string | null;
  college?: string | null;
  degree?: string | null;
  current_year?: string | null;
  company?: string | null;
  designation?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
  notif_email?: boolean | null;
  notif_purchases?: boolean | null;
  notif_certificates?: boolean | null;
  notif_internships?: boolean | null;
  notif_affiliate_payout?: boolean | null;
  notif_marketing?: boolean | null;
}

export interface PurchaseStats {
  total: number;
  certificates: number;
  internships: number;
  resumeBuilds: number;
  linkedinOpts: number;
  atsReports: number;
  memberSince: string;
}

export interface BankInitial {
  account_holder?: string | null;
  bank_name?: string | null;
  account_number_masked?: string | null;
  ifsc_code?: string | null;
  branch_name?: string | null;
  upi_id?: string | null;
  phone?: string | null;
  bank_verified?: boolean;
  bank_verified_at?: string | null;
}

// ─── Shared field component ────────────────────────────────────────────────────

function Field({
  label, required, error, hint, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const readonlyCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed select-none";
const selectCls = "w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none";

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  id, icon: Icon, title, description, children, actions,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden scroll-mt-8">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-base">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
      {actions && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

// ─── Section 1 — Personal Information ────────────────────────────────────────

function PersonalSection({ profile, email }: { profile: ProfileData; email: string }) {
  const [form, setForm] = useState({
    first_name:    profile.first_name    ?? "",
    last_name:     profile.last_name     ?? "",
    mobile:        profile.mobile        ?? "",
    date_of_birth: profile.date_of_birth ?? "",
    gender:        profile.gender        ?? "",
    country:       profile.country       ?? "",
    state:         profile.state         ?? "",
    city:          profile.city          ?? "",
    address:       profile.address       ?? "",
    pincode:       profile.pincode       ?? "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setDirty(true);
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim())  e.last_name  = "Last name is required";
    if (form.mobile && !/^\+?[0-9\s\-()]{7,15}$/.test(form.mobile)) e.mobile = "Invalid mobile number";
    if (form.pincode && !/^[0-9]{4,10}$/.test(form.pincode)) e.pincode = "Invalid pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await updatePersonalInfoAction(form);
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Personal information saved.");
    setDirty(false);
  };

  const onCancel = () => {
    setForm({
      first_name:    profile.first_name    ?? "",
      last_name:     profile.last_name     ?? "",
      mobile:        profile.mobile        ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      gender:        profile.gender        ?? "",
      country:       profile.country       ?? "",
      state:         profile.state         ?? "",
      city:          profile.city          ?? "",
      address:       profile.address       ?? "",
      pincode:       profile.pincode       ?? "",
    });
    setErrors({});
    setDirty(false);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
    setAvatarUrl(data.avatarUrl);
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
      id="personal"
      icon={User}
      title="Personal Information"
      description="Your name, contact details, and location."
      actions={
        <>
          {dirty && (
            <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </>
      }
    >
      {/* Avatar */}
      <div className="flex items-center gap-5 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-md shrink-0">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-blue-400" />
            )}
          </div>
          {!uploading && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }}
        />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {avatarUrl ? "Replace Photo" : "Upload Photo"}
            </button>
            {avatarUrl && (
              <button
                onClick={removeAvatar}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">JPG, PNG, WebP or GIF · Max 5 MB</p>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required error={errors.first_name}>
          <input value={form.first_name} onChange={set("first_name")} placeholder="First name" className={inputCls} />
        </Field>
        <Field label="Last Name" required error={errors.last_name}>
          <input value={form.last_name} onChange={set("last_name")} placeholder="Last name" className={inputCls} />
        </Field>
      </div>

      {/* Email (read-only) */}
      <Field label="Email Address" hint="Email cannot be changed here. Contact support if needed.">
        <div className={readonlyCls + " flex items-center"}>{email}</div>
      </Field>

      {/* Mobile */}
      <Field label="Mobile Number" error={errors.mobile}>
        <input value={form.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" className={inputCls} />
      </Field>

      {/* DOB + Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth">
          <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} className={inputCls} />
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={set("gender")} className={selectCls}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Country">
          <input value={form.country} onChange={set("country")} placeholder="e.g. India" className={inputCls} />
        </Field>
        <Field label="State">
          <input value={form.state} onChange={set("state")} placeholder="e.g. Maharashtra" className={inputCls} />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={set("city")} placeholder="e.g. Mumbai" className={inputCls} />
        </Field>
        <Field label="Pincode" error={errors.pincode}>
          <input value={form.pincode} onChange={set("pincode")} placeholder="400001" className={inputCls} />
        </Field>
      </div>

      {/* Address */}
      <Field label="Address">
        <textarea
          value={form.address}
          onChange={set("address") as any}
          rows={2}
          placeholder="Street address, building, landmark…"
          className={inputCls + " h-auto py-3 resize-none"}
        />
      </Field>
    </SectionCard>
  );
}

// ─── Section 2 — Professional Information ────────────────────────────────────

function ProfessionalSection({ profile }: { profile: ProfileData }) {
  const [form, setForm] = useState({
    college:       profile.college       ?? "",
    degree:        profile.degree        ?? "",
    current_year:  profile.current_year  ?? "",
    company:       profile.company       ?? "",
    designation:   profile.designation   ?? "",
    linkedin_url:  profile.linkedin_url  ?? "",
    github_url:    profile.github_url    ?? "",
    portfolio_url: profile.portfolio_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const [resumeUploading, setResumeUploading] = useState(false);
  const [hasResume, setHasResume] = useState(!!profile.resume_url);
  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setDirty(true);
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    const urlRegex = /^https?:\/\/.+\..+/;
    if (form.linkedin_url  && !urlRegex.test(form.linkedin_url))  e.linkedin_url  = "Enter a valid URL (https://...)";
    if (form.github_url    && !urlRegex.test(form.github_url))    e.github_url    = "Enter a valid URL (https://...)";
    if (form.portfolio_url && !urlRegex.test(form.portfolio_url)) e.portfolio_url = "Enter a valid URL (https://...)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await updateProfessionalInfoAction(form);
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Professional information saved.");
    setDirty(false);
  };

  const onCancel = () => {
    setForm({
      college:       profile.college       ?? "",
      degree:        profile.degree        ?? "",
      current_year:  profile.current_year  ?? "",
      company:       profile.company       ?? "",
      designation:   profile.designation   ?? "",
      linkedin_url:  profile.linkedin_url  ?? "",
      github_url:    profile.github_url    ?? "",
      portfolio_url: profile.portfolio_url ?? "",
    });
    setErrors({});
    setDirty(false);
  };

  const uploadResume = async (file: File) => {
    setResumeUploading(true);
    const fd = new FormData();
    fd.append("resume", file);
    const res = await fetch("/api/profile/resume", { method: "POST", body: fd });
    const data = await res.json();
    setResumeUploading(false);
    if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
    setHasResume(true);
    setResumeSignedUrl(data.resumeUrl);
    toast.success("Resume uploaded.");
  };

  const viewResume = async () => {
    if (resumeSignedUrl) { window.open(resumeSignedUrl, "_blank"); return; }
    const res = await fetch("/api/profile/resume");
    const data = await res.json();
    if (data.resumeUrl) window.open(data.resumeUrl, "_blank");
    else toast.error("Resume not found");
  };

  const deleteResume = async () => {
    const res = await fetch("/api/profile/resume", { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to remove resume"); return; }
    setHasResume(false);
    setResumeSignedUrl(null);
    toast.success("Resume removed.");
  };

  return (
    <SectionCard
      id="professional"
      icon={Briefcase}
      title="Professional Information"
      description="Your education, work background, and online presence."
      actions={
        <>
          {dirty && (
            <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </>
      }
    >
      {/* Education */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <GraduationCap className="w-3.5 h-3.5" /> Education
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="College / University">
          <input value={form.college} onChange={set("college")} placeholder="e.g. Mumbai University" className={inputCls} />
        </Field>
        <Field label="Degree">
          <input value={form.degree} onChange={set("degree")} placeholder="e.g. B.Tech Computer Science" className={inputCls} />
        </Field>
        <Field label="Current Year">
          <select value={form.current_year} onChange={set("current_year")} className={selectCls}>
            <option value="">Select year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Graduated">Graduated</option>
            <option value="Post-Graduate">Post-Graduate</option>
            <option value="Other">Other</option>
          </select>
        </Field>
      </div>

      {/* Work */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
        <Building2 className="w-3.5 h-3.5" /> Work
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company">
          <input value={form.company} onChange={set("company")} placeholder="e.g. Google" className={inputCls} />
        </Field>
        <Field label="Designation">
          <input value={form.designation} onChange={set("designation")} placeholder="e.g. Software Engineer" className={inputCls} />
        </Field>
      </div>

      {/* Online presence */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
        <Globe className="w-3.5 h-3.5" /> Online Presence
      </div>
      <Field label="LinkedIn Profile" error={errors.linkedin_url}>
        <div className="relative">
          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/yourname" className={inputCls + " pl-9"} />
        </div>
      </Field>
      <Field label="GitHub Profile" error={errors.github_url}>
        <div className="relative">
          <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/yourname" className={inputCls + " pl-9"} />
        </div>
      </Field>
      <Field label="Portfolio Website" error={errors.portfolio_url}>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={form.portfolio_url} onChange={set("portfolio_url")} placeholder="https://yoursite.com" className={inputCls + " pl-9"} />
        </div>
      </Field>

      {/* Resume */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
        <FileText className="w-3.5 h-3.5" /> Resume
      </div>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {hasResume ? "resume.pdf" : "No resume uploaded"}
          </p>
          <p className="text-xs text-gray-400">PDF only · Max 10 MB</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasResume && (
            <>
              <button
                onClick={viewResume}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button
                onClick={() => resumeRef.current?.click()}
                disabled={resumeUploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {resumeUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Replace
              </button>
              <button
                onClick={deleteResume}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {!hasResume && (
            <button
              onClick={() => resumeRef.current?.click()}
              disabled={resumeUploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {resumeUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Resume
            </button>
          )}
        </div>
      </div>
      <input
        ref={resumeRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadResume(f); e.target.value = ""; }}
      />
    </SectionCard>
  );
}

// ─── Section 3 — Security ─────────────────────────────────────────────────────

function SecuritySection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.currentPassword)        e.currentPassword = "Current password is required";
    if (form.newPassword.length < 8)  e.newPassword     = "Must be at least 8 characters";
    if (!form.confirmPassword)        e.confirmPassword = "Please confirm your new password";
    if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await updatePasswordAction(form);
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Password updated successfully.");
    setOpen(false);
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <SectionCard
      id="security"
      icon={Shield}
      title="Security"
      description="Manage your account password."
    >
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Password</p>
          <p className="text-sm text-gray-400 tracking-widest mt-0.5">••••••••••••</p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          {open ? <X className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
          {open ? "Cancel" : "Change Password"}
        </button>
      </div>

      {open && (
        <div className="space-y-4 p-5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10">
          <Field label="Current Password" error={errors.currentPassword}>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={set("currentPassword")}
                placeholder="Enter current password"
                className={inputCls + " pr-11"}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="New Password" error={errors.newPassword}>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={set("newPassword")}
                placeholder="Minimum 8 characters"
                className={inputCls + " pr-11"}
              />
              <button
                type="button"
                onClick={() => setShowNew(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm New Password" error={errors.confirmPassword}>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="Re-enter new password"
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end pt-1">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Password
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section 4 — Purchase Information ────────────────────────────────────────

function PurchasesSection({ stats }: { stats: PurchaseStats }) {
  const items = [
    { label: "Total Purchases",       value: stats.total,        icon: ShoppingBag, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20"    },
    { label: "Certificates",          value: stats.certificates, icon: CheckCircle2, color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20"  },
    { label: "Internships",           value: stats.internships,  icon: Briefcase,    color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Resume Builds",         value: stats.resumeBuilds, icon: FileText,     color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: "LinkedIn Optimizations",value: stats.linkedinOpts, icon: Link2,        color: "text-sky-500",    bg: "bg-sky-50 dark:bg-sky-900/20"       },
    { label: "ATS Reports",           value: stats.atsReports,   icon: Shield,       color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  ];

  return (
    <SectionCard
      id="purchases"
      icon={ShoppingBag}
      title="Purchase Information"
      description="A summary of everything you have purchased on ProCerix."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(item => (
          <div key={item.label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
        <span className="text-sm text-gray-500">Member since</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.memberSince}</span>
      </div>
    </SectionCard>
  );
}

// ─── Section 5 — Bank Details ─────────────────────────────────────────────────

function BankSection({ bankDetails, isAffiliate }: { bankDetails: BankInitial | null; isAffiliate: boolean }) {
  // Map null → undefined so it matches BankDetailsForm's prop types
  const bankInitial = bankDetails ? {
    account_holder:        bankDetails.account_holder        ?? undefined,
    bank_name:             bankDetails.bank_name             ?? undefined,
    account_number_masked: bankDetails.account_number_masked ?? undefined,
    ifsc_code:             bankDetails.ifsc_code             ?? undefined,
    branch_name:           bankDetails.branch_name           ?? undefined,
    upi_id:                bankDetails.upi_id                ?? undefined,
    phone:                 bankDetails.phone                 ?? undefined,
    bank_verified:         bankDetails.bank_verified         ?? false,
    bank_verified_at:      bankDetails.bank_verified_at      ?? undefined,
  } : {};

  return (
    <div id="bank" className="scroll-mt-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
          <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-base">Bank Details</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isAffiliate ? "For weekly payout transfers from your affiliate earnings." : "Available for affiliate members only."}
          </p>
        </div>
      </div>
      {isAffiliate ? (
        <BankDetailsForm initial={bankInitial} />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center space-y-3">
          <Landmark className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Bank details are only available for affiliate members.</p>
          <a href="/affiliate/apply" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Apply to become an affiliate <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Section 6 — Notification Preferences ────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function NotificationsSection({ profile }: { profile: ProfileData }) {
  const [prefs, setPrefs] = useState({
    notif_email:            profile.notif_email            ?? true,
    notif_purchases:        profile.notif_purchases        ?? true,
    notif_certificates:     profile.notif_certificates     ?? true,
    notif_internships:      profile.notif_internships      ?? true,
    notif_affiliate_payout: profile.notif_affiliate_payout ?? true,
    notif_marketing:        profile.notif_marketing        ?? false,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof prefs) => (v: boolean) =>
    setPrefs(prev => ({ ...prev, [key]: v }));

  const onSave = async () => {
    setSaving(true);
    const result = await updateNotificationsAction(prefs);
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Notification preferences saved.");
  };

  const items: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: "notif_email",            label: "Email Notifications",       description: "Receive important account emails from us." },
    { key: "notif_purchases",        label: "Purchase Updates",          description: "Order confirmations and payment receipts." },
    { key: "notif_certificates",     label: "Certificate Notifications", description: "When your certificate is ready to download." },
    { key: "notif_internships",      label: "Internship Notifications",  description: "Updates on your internship tasks and status." },
    { key: "notif_affiliate_payout", label: "Affiliate Payout Updates",  description: "Weekly payout processing and transfer alerts." },
    { key: "notif_marketing",        label: "Marketing Emails",          description: "Promotions, new courses, and special offers." },
  ];

  return (
    <SectionCard
      id="notifications"
      icon={Bell}
      title="Notification Preferences"
      description="Choose which emails you would like to receive."
      actions={
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Preferences
        </button>
      }
    >
      <div>
        {items.map(item => (
          <Toggle
            key={item.key}
            checked={prefs[item.key]}
            onChange={set(item.key)}
            label={item.label}
            description={item.description}
          />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section 7 — Danger Zone ──────────────────────────────────────────────────

function DangerZoneSection() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");

  const onLogout = async () => {
    setLoggingOut(true);
    const result = await logoutAction();
    if (result.error) { toast.error(result.error); setLoggingOut(false); return; }
    router.push("/login");
  };

  const onDelete = async () => {
    if (confirm !== "DELETE") { toast.error('Type DELETE to confirm'); return; }
    setDeleting(true);
    const result = await deleteAccountAction();
    if (result.error) { toast.error(result.error); setDeleting(false); return; }
    toast.success("Account deleted.");
    router.push("/");
  };

  return (
    <SectionCard
      id="danger"
      icon={AlertTriangle}
      title="Danger Zone"
      description="Irreversible account actions."
    >
      {/* Logout */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Sign Out</p>
          <p className="text-xs text-gray-400 mt-0.5">Log out from your account on this device.</p>
        </div>
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Log Out
        </button>
      </div>

      {/* Delete */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Account</p>
          <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5">Permanently deletes all your data. This cannot be undone.</p>
        </div>
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Delete Account?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This action is permanent and cannot be reversed.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All your data, certificates, and purchase history will be permanently deleted.
            </p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500">Type <span className="font-mono text-red-500">DELETE</span> to confirm</p>
              <input
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="DELETE"
                className={inputCls}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setDeleteOpen(false); setConfirm(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                disabled={deleting || confirm !== "DELETE"}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
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

// ─── Navigation sidebar ────────────────────────────────────────────────────────

const navItems = [
  { id: "personal",      label: "Personal Info",   icon: User         },
  { id: "professional",  label: "Professional",    icon: Briefcase    },
  { id: "security",      label: "Security",        icon: Shield       },
  { id: "purchases",     label: "Purchases",       icon: ShoppingBag  },
  { id: "bank",          label: "Bank Details",    icon: Landmark     },
  { id: "notifications", label: "Notifications",   icon: Bell         },
  { id: "danger",        label: "Danger Zone",     icon: AlertTriangle},
];

// ─── Main export ───────────────────────────────────────────────────────────────

export function ProfileSettingsPage({
  profile,
  email,
  purchaseStats,
  bankDetails,
  isAffiliate,
}: {
  profile: ProfileData;
  email: string;
  purchaseStats: PurchaseStats;
  bankDetails: BankInitial | null;
  isAffiliate: boolean;
}) {
  const [activeSection, setActiveSection] = useState("personal");

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // IntersectionObserver to track active section in sidebar
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { threshold: 0.25, rootMargin: "-80px 0px -55% 0px" },
    );
    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your profile, security, and preferences.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar — hidden on mobile, sticky on desktop */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
          <nav className="space-y-0.5">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {activeSection === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile: horizontal scrollable tab bar */}
        <div className="lg:hidden -mx-4 px-4 mb-6 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          <PersonalSection profile={profile} email={email} />
          <ProfessionalSection profile={profile} />
          <SecuritySection />
          <PurchasesSection stats={purchaseStats} />
          <BankSection bankDetails={bankDetails} isAffiliate={isAffiliate} />
          <NotificationsSection profile={profile} />
          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
}
