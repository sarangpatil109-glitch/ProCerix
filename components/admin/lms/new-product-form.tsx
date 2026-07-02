"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Briefcase } from "lucide-react";

export function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    course_type: "certificates",
    title: "",
    category: "",
    difficulty: "beginner",
    price: "99",
    original_price: "999",
    description: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_COURSE",
          title: form.title.trim(),
          course_type: form.course_type,
          description: form.description.trim() || null,
          category: form.category.trim() || null,
          price: parseFloat(form.price) || 0,
          original_price: parseFloat(form.original_price) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Product created!");
      router.push(`/admin/lms/${data.id}`);
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Type</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "certificates", label: "Certificate", desc: "Skill certification with 4–5 modules and 10 MCQs", icon: BookOpen, color: "blue" },
            { value: "internship", label: "Virtual Internship", desc: "Internship program with 7–8 modules and 20 MCQs", icon: Briefcase, color: "purple" },
          ].map((t) => {
            const Icon = t.icon;
            const active = form.course_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set("course_type", t.value)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  active
                    ? t.color === "blue"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${active ? (t.color === "blue" ? "text-blue-600" : "text-purple-600") : "text-gray-400"}`} />
                <p className={`font-bold text-sm ${active ? (t.color === "blue" ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300") : "text-gray-700 dark:text-gray-300"}`}>
                  {t.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Title <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={form.course_type === "certificates" ? "e.g. Python for Data Science" : "e.g. Full Stack Web Development"}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Short Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Brief description of what students will learn..."
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Category & Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Programming, Marketing"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selling Price (₹)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Original Price (₹)</label>
          <input
            type="number"
            value={form.original_price}
            onChange={(e) => set("original_price", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create & Build →"}
        </button>
      </div>
    </form>
  );
}
