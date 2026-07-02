"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, Star, FileText, Award, Briefcase } from "lucide-react";

interface Template {
  id: string;
  name: string;
  type: "certificate" | "offer_letter" | "completion_letter" | "internship_letter";
  content: string;
  variables: string[] | null;
  preview_url: string | null;
  is_default: boolean;
  created_at: string;
}

interface Props { initialTemplates: Template[] }

const TYPE_ICONS: Record<string, any> = {
  certificate: Award,
  offer_letter: FileText,
  completion_letter: FileText,
  internship_letter: Briefcase,
};

const TYPE_LABELS: Record<string, string> = {
  certificate: "Certificate",
  offer_letter: "Offer Letter",
  completion_letter: "Completion Letter",
  internship_letter: "Internship Letter",
};

export function TemplatesManager({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id || null);
  const [creating, setCreating] = useState(false);
  const [editContent, setEditContent] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", type: "certificate", content: "", variables: "" });

  const selected = templates.find((t) => t.id === selectedId) || null;

  const openTemplate = (t: Template) => {
    setSelectedId(t.id);
    setEditContent(t.content);
    setEditName(t.name);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_TEMPLATE", id: selected.id, name: editName, content: editContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((ts) => ts.map((t) => (t.id === selected.id ? data : t)));
      toast.success("Template saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    if (!newForm.name || !newForm.content) { toast.error("Name and content required"); return; }
    setSaving(true);
    try {
      const vars = newForm.variables ? newForm.variables.split(",").map((v) => v.trim()).filter(Boolean) : [];
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_TEMPLATE", ...newForm, variables: vars }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((ts) => [data, ...ts]);
      setSelectedId(data.id);
      setEditContent(data.content);
      setEditName(data.name);
      setCreating(false);
      setNewForm({ name: "", type: "certificate", content: "", variables: "" });
      toast.success("Template created");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_TEMPLATE", id }),
      });
      setTemplates((ts) => ts.filter((t) => t.id !== id));
      if (selectedId === id) setSelectedId(templates.find((t) => t.id !== id)?.id || null);
      toast.success("Deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const COMMON_VARS = ["{{student_name}}", "{{company_name}}", "{{internship_title}}", "{{supervisor_name}}", "{{duration}}", "{{start_date}}", "{{end_date}}", "{{completion_date}}", "{{course_title}}"];

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 space-y-2">
        <button onClick={() => setCreating(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-2xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />New Template
        </button>
        {templates.map((t) => {
          const Icon = TYPE_ICONS[t.type] || FileText;
          return (
            <button key={t.id} onClick={() => openTemplate(t)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${selectedId === t.id && !creating ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300"}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{t.name}</p>
                <p className={`text-[10px] truncate ${selectedId === t.id && !creating ? "text-blue-200" : "text-gray-400"}`}>{TYPE_LABELS[t.type]}</p>
              </div>
              {t.is_default && <Star className="w-3 h-3 shrink-0 text-amber-400" />}
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {creating ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">New Template</h3>
              <button onClick={() => setCreating(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Template Name *</label>
                <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Default Certificate" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Type</label>
                <select value={newForm.type} onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="certificate">Certificate</option>
                  <option value="offer_letter">Offer Letter</option>
                  <option value="completion_letter">Completion Letter</option>
                  <option value="internship_letter">Internship Letter</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-gray-500">Variables (comma-separated)</label>
                <input value={newForm.variables} onChange={(e) => setNewForm((f) => ({ ...f, variables: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="{{student_name}}, {{company_name}}" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Content *</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_VARS.map((v) => (
                  <button key={v} type="button" onClick={() => setNewForm((f) => ({ ...f, content: f.content + v }))}
                    className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono rounded-lg hover:bg-blue-100 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
              <textarea value={newForm.content} onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
                rows={12} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                placeholder="Template content with {{variables}}..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                <Save className="w-3.5 h-3.5" />{saving ? "Creating…" : "Create"}
              </button>
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <input value={editName} onChange={(e) => setEditName(e.target.value)}
                className="font-bold text-gray-900 dark:text-white text-base bg-transparent focus:outline-none border-b border-transparent focus:border-blue-400" />
              <div className="flex gap-2">
                <button onClick={() => handleDelete(selected.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" />{saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {COMMON_VARS.map((v) => (
                  <button key={v} type="button" onClick={() => setEditContent((c) => c + v)}
                    className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono rounded-lg hover:bg-blue-100 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 p-5 text-sm font-mono bg-transparent focus:outline-none resize-none text-gray-700 dark:text-gray-300"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 dark:text-gray-700">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Select a template to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
