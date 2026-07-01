"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Pencil, Save, X, Landmark } from "lucide-react";

interface BankInitial {
  account_holder?:        string;
  bank_name?:             string;
  /** Pre-masked (XXXXXX4589) — never the raw number */
  account_number_masked?: string;
  ifsc_code?:             string;
  branch_name?:           string;
  upi_id?:                string;
  phone?:                 string;
  bank_verified?:         boolean;
  bank_verified_at?:      string;
}

interface FormState {
  account_holder:        string;
  bank_name:             string;
  account_number:        string;
  confirm_account_number: string;
  ifsc_code:             string;
  branch_name:           string;
  upi_id:                string;
  phone:                 string;
}

const EMPTY_FORM: FormState = {
  account_holder:         "",
  bank_name:              "",
  account_number:         "",
  confirm_account_number: "",
  ifsc_code:              "",
  branch_name:            "",
  upi_id:                 "",
  phone:                  "",
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function BankDetailsForm({ initial }: { initial: BankInitial }) {
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);

  const hasDetails =
    initial.account_holder && initial.account_number_masked && initial.ifsc_code;

  const set = (key: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openEdit = () => {
    // Pre-fill non-sensitive fields; account numbers must be re-entered
    setForm({
      account_holder:         initial.account_holder   ?? "",
      bank_name:              initial.bank_name        ?? "",
      account_number:         "",   // always blank for security
      confirm_account_number: "",
      ifsc_code:              initial.ifsc_code        ?? "",
      branch_name:            initial.branch_name      ?? "",
      upi_id:                 initial.upi_id           ?? "",
      phone:                  initial.phone            ?? "",
    });
    setEditing(true);
  };

  const validate = (): string | null => {
    if (!form.account_holder.trim())         return "Account holder name is required";
    if (!form.account_number.trim())         return "Account number is required";
    if (!form.confirm_account_number.trim()) return "Please confirm your account number";
    if (form.account_number !== form.confirm_account_number)
                                             return "Account numbers do not match";
    if (!form.ifsc_code.trim())              return "IFSC code is required";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc_code.trim()))
                                             return "Invalid IFSC code — expected format like SBIN0001234";
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/affiliate/profile/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ifsc_code: form.ifsc_code.toUpperCase().trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message ?? "Bank details saved");
        setEditing(false);
        window.location.reload();
      } else {
        toast.error(data.error ?? "Failed to save");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Bank Details</h3>
            <p className="text-xs text-gray-400 mt-0.5">Required for weekly payout transfers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Verification badge */}
          {hasDetails && (
            initial.bank_verified ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                <ShieldCheck className="w-4 h-4" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                <ShieldOff className="w-4 h-4" /> Pending Verification
              </span>
            )
          )}

          {!editing ? (
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {hasDetails ? "Edit" : "Add Details"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save Bank Details"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Account Holder Name"
              value={form.account_holder}
              onChange={set("account_holder")}
              placeholder="Full name as on bank account"
              required
            />
            <InputField
              label="Bank Name"
              value={form.bank_name}
              onChange={set("bank_name")}
              placeholder="e.g. State Bank of India"
            />
            <InputField
              label="Account Number"
              value={form.account_number}
              onChange={set("account_number")}
              placeholder="Enter account number"
              required
              type="text"
            />
            <InputField
              label="Confirm Account Number"
              value={form.confirm_account_number}
              onChange={set("confirm_account_number")}
              placeholder="Re-enter account number"
              required
              type="text"
            />
            <InputField
              label="IFSC Code"
              value={form.ifsc_code}
              onChange={v => set("ifsc_code")(v.toUpperCase())}
              placeholder="e.g. SBIN0001234"
              required
              hint="4 letters · 0 · 6 alphanumeric (e.g. SBIN0001234)"
            />
            <InputField
              label="Branch Name"
              value={form.branch_name}
              onChange={set("branch_name")}
              placeholder="e.g. MG Road Branch"
            />
            <InputField
              label="UPI ID"
              value={form.upi_id}
              onChange={set("upi_id")}
              placeholder="e.g. name@upi"
            />
            <InputField
              label="Mobile Number"
              value={form.phone}
              onChange={set("phone")}
              placeholder="10-digit number"
            />
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-xs text-yellow-700 dark:text-yellow-400">
            Saving new bank details resets verification. Admin will re-verify before payouts resume.
            Account numbers are never shown in full after saving.
          </div>
        </div>
      ) : hasDetails ? (
        /* View mode */
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[
            { label: "Account Holder",  value: initial.account_holder },
            { label: "Bank Name",       value: initial.bank_name || "—" },
            { label: "Account Number",  value: initial.account_number_masked, mono: true },
            { label: "IFSC Code",       value: initial.ifsc_code, mono: true },
            { label: "Branch Name",     value: initial.branch_name || "—" },
            { label: "UPI ID",          value: initial.upi_id || "—" },
            { label: "Mobile",          value: initial.phone || "—" },
            {
              label: "Verification",
              value: initial.bank_verified
                ? `✓ Bank Details Verified${initial.bank_verified_at ? ` — ${new Date(initial.bank_verified_at).toLocaleDateString("en-IN")}` : ""}`
                : "Pending Verification",
              color: initial.bank_verified ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400",
            },
          ].map(r => (
            <div key={r.label} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500">{r.label}</span>
              <span className={`text-sm font-medium ${(r as any).color ?? "text-gray-900 dark:text-white"} ${(r as any).mono ? "font-mono tracking-wider" : ""}`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="px-6 py-10 text-center space-y-2">
          <Landmark className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto" />
          <p className="text-gray-400 font-medium text-sm">No bank details added yet</p>
          <p className="text-gray-400 text-xs">Add your bank account to start receiving weekly payouts</p>
        </div>
      )}
    </div>
  );
}
