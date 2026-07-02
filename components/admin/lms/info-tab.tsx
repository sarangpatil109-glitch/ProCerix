"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Plus, X, Clock, Tag } from "lucide-react";

interface Props {
  course: any;
  onUpdate: (updated: any) => void;
}

export function InfoTab({ course, onUpdate }: Props) {
  const [form, setForm] = useState({
    title: course.title || "",
    description: course.description || "",
    category: course.category || "",
    difficulty: course.difficulty || "beginner",
    price: String(course.price || "0"),
    original_price: String(course.original_price || "0"),
    duration: course.duration || "",
    thumbnail_url: course.thumbnail_url || course.thumbnail || "",
    seo_title: course.seo_title || "",
    seo_description: course.seo_description || "",
    is_featured: course.is_featured || false,
  });
  const [outcomes, setOutcomes] = useState<string[]>(
    Array.isArray(course.learning_outcomes) ? course.learning_outcomes : []
  );
  const [requirements, setRequirements] = useState<string[]>(
    Array.isArray(course.requirements) ? course.requirements : []
  );
  const [tags, setTags] = useState<string[]>(Array.isArray(course.tags) ? course.tags : []);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setDirty(true); }, [form, outcomes, requirements, tags]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const addOutcome = () => setOutcomes((o) => [...o, ""]);
  const setOutcome = (i: number, v: string) => setOutcomes((o) => o.map((x, j) => j === i ? v : x));
  const removeOutcome = (i: number) => setOutcomes((o) => o.filter((_, j) => j !== i));

  const addReq = () => setRequirements((r) => [...r, ""]);
  const setReq = (i: number, v: string) => setRequirements((r) => r.map((x, j) => j === i ? v : x));
  const removeReq = (i: number) => setRequirements((r) => r.filter((_, j) => j !== i));

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((tt) => [...tt, t]);
    setNewTag("");
  };

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
          price: parseFloat(form.price) || 0,
          original_price: parseFloat(form.original_price) || 0,
          learning_outcomes: outcomes.filter(Boolean),
          requirements: requirements.filter(Boolean),
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data);
      setDirty(false);
      toast.success("Saved!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const isCert = course.course_type === "certificates" || course.course_type === "certificate";

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Information</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-60 shadow-lg shadow-blue-500/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Basic Info */}
      <div className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Basic Details</h4>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Product title"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe what students will learn..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Programming"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selling Price (₹)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Original Price (₹)</label>
            <input
              type="number"
              value={form.original_price}
              onChange={(e) => set("original_price", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />Duration
            </label>
            <input
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 4 weeks"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail URL</label>
          <input
            value={form.thumbnail_url}
            onChange={(e) => set("thumbnail_url", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          {form.thumbnail_url && (
            <img src={form.thumbnail_url} alt="Thumbnail" className="mt-2 w-32 h-20 object-cover rounded-lg border border-gray-200" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_featured"
            checked={form.is_featured}
            onChange={(e) => set("is_featured", e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Featured product (shown prominently on homepage)
          </label>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide flex items-center gap-2">
          <Tag className="w-4 h-4" /> Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
              {t}
              <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add tag and press Enter"
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={addTag} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Add
          </button>
        </div>
      </div>

      {/* Learning Outcomes */}
      <div className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">What Students Will Learn</h4>
        <div className="space-y-2">
          {outcomes.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={o}
                onChange={(e) => setOutcome(i, e.target.value)}
                placeholder={`Outcome ${i + 1}`}
                className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => removeOutcome(i)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addOutcome} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline">
          <Plus className="w-4 h-4" /> Add outcome
        </button>
      </div>

      {/* Requirements */}
      <div className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Prerequisites / Requirements</h4>
        <div className="space-y-2">
          {requirements.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r}
                onChange={(e) => setReq(i, e.target.value)}
                placeholder={`Requirement ${i + 1}`}
                className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => removeReq(i)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addReq} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline">
          <Plus className="w-4 h-4" /> Add requirement
        </button>
      </div>

      {/* SEO */}
      <div className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">SEO</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SEO Title</label>
            <input
              value={form.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Defaults to product title"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SEO Description</label>
            <textarea
              value={form.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Meta description for search engines..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
