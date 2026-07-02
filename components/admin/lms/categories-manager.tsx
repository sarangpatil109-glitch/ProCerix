"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, GripVertical, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sequence_order: number;
}

interface Props { initialCategories: Category[] }

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#f97316", "#ec4899"];

export function CategoriesManager({ initialCategories }: Props) {
  const [cats, setCats] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "", color: COLORS[0], is_active: true });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_CATEGORY", ...form, slug: form.slug || slugify(form.name), sequence_order: cats.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCats((c) => [...c, data]);
      setCreating(false);
      setForm({ name: "", slug: "", description: "", icon: "", color: COLORS[0], is_active: true });
      toast.success("Category created");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id: string, fields: Partial<Category>) => {
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_CATEGORY", id, ...fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCats((c) => c.map((cat) => (cat.id === id ? data : cat)));
      setEditingId(null);
      toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_CATEGORY", id }),
      });
      setCats((c) => c.filter((cat) => cat.id !== id));
      toast.success("Deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {/* New form */}
      {creating ? (
        <div className="bg-white dark:bg-gray-900 border-2 border-blue-400 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Name *</label>
              <input value={form.name} onChange={(e) => { set("name", e.target.value); set("slug", slugify(e.target.value)); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Technology" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Slug</label>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="technology" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Icon (emoji or text)</label>
              <input value={form.icon} onChange={(e) => set("icon", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="💻" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Description</label>
              <input value={form.description} onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Short description" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => set("color", c)} style={{ background: c }}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center">
                  {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
              <Save className="w-3.5 h-3.5" />{saving ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setCreating(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-2xl w-full justify-center text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />Add Category
        </button>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {cats.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            {editingId === cat.id ? (
              <EditRow cat={cat} onSave={(f) => handleUpdate(cat.id, f)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center gap-4 px-5 py-4">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: cat.color || "#3b82f6" + "20" }}>
                  {cat.icon || "📁"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{cat.name}</p>
                    <span className="font-mono text-xs text-gray-400">{cat.slug}</span>
                    {!cat.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold">INACTIVE</span>}
                  </div>
                  {cat.description && <p className="text-xs text-gray-400 truncate mt-0.5">{cat.description}</p>}
                </div>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color || "#3b82f6" }} />
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingId(cat.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {cats.length === 0 && !creating && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No categories yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditRow({ cat, onSave, onCancel }: { cat: Category; onSave: (f: any) => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: cat.name, slug: cat.slug, description: cat.description || "", icon: cat.icon || "", color: cat.color || COLORS[0], is_active: cat.is_active });
  return (
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Name" />
        <input value={f.slug} onChange={(e) => setF((s) => ({ ...s, slug: e.target.value }))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="slug" />
        <input value={f.icon} onChange={(e) => setF((s) => ({ ...s, icon: e.target.value }))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Icon emoji" />
        <input value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description" />
      </div>
      <div className="flex items-center gap-2">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setF((s) => ({ ...s, color: c }))} style={{ background: c }}
            className="w-6 h-6 rounded-full flex items-center justify-center">
            {f.color === c && <Check className="w-3 h-3 text-white" />}
          </button>
        ))}
        <label className="ml-3 flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={f.is_active} onChange={(e) => setF((s) => ({ ...s, is_active: e.target.checked }))} className="rounded" />
          Active
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(f)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
          <Save className="w-3 h-3" />Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
