"use client";
import { useState } from "react";
import Link from "next/link";

interface PartnerFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

function PartnerField({ label, value, onChange, type = "text", required = false, placeholder = "" }: PartnerFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}

export default function PartnerRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "", college_name: "", designation: "", email: "", phone: "",
    upi_id: "", bank_name: "", bank_account_number: "", bank_ifsc: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/partner/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Submitted!</h1>
          <p className="text-gray-500">Your partner application is under review. You&apos;ll receive an email once approved (usually within 24 hours).</p>
          <Link href="/" className="block w-full py-3 px-6 rounded-xl bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-black font-bold">P</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">ProCerix</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Become a Partner</h1>
          <p className="text-gray-500 mt-2">Earn commission for every student you refer. Teachers, colleges, and influencers welcome.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PartnerField label="Full Name" value={form.full_name} onChange={set("full_name")} required placeholder="Rahul Patil" />
                <PartnerField label="College / Organization Name" value={form.college_name} onChange={set("college_name")} placeholder="KCE, MIT, etc." />
                <PartnerField label="Designation" value={form.designation} onChange={set("designation")} placeholder="Professor, Influencer, etc." />
                <PartnerField label="Email" value={form.email} onChange={set("email")} type="email" required placeholder="you@example.com" />
                <PartnerField label="Phone" value={form.phone} onChange={set("phone")} type="tel" required placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PartnerField label="UPI ID" value={form.upi_id} onChange={set("upi_id")} placeholder="name@upi" />
                <PartnerField label="Bank Name" value={form.bank_name} onChange={set("bank_name")} placeholder="SBI, HDFC, etc." />
                <PartnerField label="Account Number" value={form.bank_account_number} onChange={set("bank_account_number")} placeholder="0000000000" />
                <PartnerField label="IFSC Code" value={form.bank_ifsc} onChange={set("bank_ifsc")} placeholder="SBIN0001234" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/30 transition-all disabled:opacity-70"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already a partner? <Link href="/partner/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
