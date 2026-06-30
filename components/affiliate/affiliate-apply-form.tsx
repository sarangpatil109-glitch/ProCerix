"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Field {
  name: keyof FormData;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  as?: "textarea";
}

interface FormData {
  name: string;
  phone: string;
  college_name: string;
  designation: string;
  experience: string;
}

const FIELDS: Field[] = [
  { name: "name", label: "Full Name", placeholder: "e.g. Rahul Patil", required: true },
  { name: "phone", label: "Phone Number", placeholder: "+91 9876543210", required: true, type: "tel" },
  { name: "college_name", label: "College / Institution", placeholder: "e.g. Mumbai University" },
  { name: "designation", label: "Designation / Role", placeholder: "e.g. Student, Teacher, Influencer" },
  { name: "experience", label: "Why do you want to join?", placeholder: "Tell us a bit about yourself and your audience...", as: "textarea" },
];

export function AffiliateApplyForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ name: "", phone: "", college_name: "", designation: "", experience: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        return;
      }
      if (data.status === "approved") {
        toast.success("Application auto-approved! Redirecting to dashboard...");
        setTimeout(() => router.push("/affiliate/dashboard"), 1500);
      } else {
        setSubmitted(true);
        toast.success("Application submitted successfully!");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Application Submitted!</h3>
        <p className="text-gray-500 text-sm">We'll review your application within 24–48 hours and notify you by email once approved.</p>
        <div className="pt-2">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {FIELDS.map(f => (
        <div key={f.name}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {f.label}{f.required && " *"}
          </label>
          {f.as === "textarea" ? (
            <textarea
              value={form[f.name]}
              onChange={set(f.name)}
              placeholder={f.placeholder}
              rows={3}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <input
              type={f.type || "text"}
              value={form[f.name]}
              onChange={set(f.name)}
              placeholder={f.placeholder}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Apply Now →"}
      </button>
      <p className="text-center text-xs text-gray-400">Free to join · No fees · Instant approval for eligible applicants</p>
    </form>
  );
}
