"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, X, Star, FileText, Award, Briefcase, ChevronRight } from "lucide-react";

type TemplateType = "certificate" | "offer_letter" | "completion_letter" | "internship_letter";

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  variables: string[] | null;
  preview_url: string | null;
  is_default: boolean;
  created_at: string;
}

interface Props { initialTemplates: Template[] }

const CERT_TYPES: TemplateType[] = ["certificate"];
const INTERN_TYPES: TemplateType[] = ["offer_letter", "completion_letter", "internship_letter"];

const TYPE_LABELS: Record<TemplateType, string> = {
  certificate: "Certificate",
  offer_letter: "Offer Letter",
  completion_letter: "Completion Letter",
  internship_letter: "Internship Letter",
};

const CERT_VARS = ["{{student_name}}", "{{course_title}}", "{{issue_date}}", "{{credential_id}}", "{{passing_score}}"];
const INTERN_VARS = [
  "{{student_name}}", "{{company_name}}", "{{internship_title}}", "{{supervisor_name}}",
  "{{duration}}", "{{start_date}}", "{{end_date}}", "{{completion_date}}", "{{field}}",
];

export function TemplatesManager({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [activeSection, setActiveSection] = useState<"certificate" | "internship">("certificate");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", type: "certificate" as TemplateType, content: "", variables: "" });

  const sectionTemplates = templates.filter((t) =>
    activeSection === "certificate" ? CERT_TYPES.includes(t.type) : INTERN_TYPES.includes(t.type)
  );

  const selected = templates.find((t) => t.id === selectedId) || null;
  const vars = activeSection === "certificate" ? CERT_VARS : INTERN_VARS;

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
      const varList = newForm.variables ? newForm.variables.split(",").map((v) => v.trim()).filter(Boolean) : [];
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_TEMPLATE", ...newForm, variables: varList }),
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
      if (selectedId === id) { setSelectedId(null); setEditContent(""); setEditName(""); }
      toast.success("Deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const insertVar = (v: string) => {
    if (creating) setNewForm((f) => ({ ...f, content: f.content + v }));
    else setEditContent((c) => c + v);
  };

  const setNewType = (type: TemplateType) => {
    setNewForm((f) => ({ ...f, type }));
  };

  return (
    <div className="space-y-5">
      {/* Section tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveSection("certificate"); setSelectedId(null); setCreating(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSection === "certificate" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 hover:border-amber-300"}`}
        >
          <Award className="w-4 h-4" />Certificate Templates
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeSection === "certificate" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
            {templates.filter((t) => CERT_TYPES.includes(t.type)).length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSection("internship"); setSelectedId(null); setCreating(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSection === "internship" ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 hover:border-purple-300"}`}
        >
          <Briefcase className="w-4 h-4" />Internship Templates
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeSection === "internship" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
            {templates.filter((t) => INTERN_TYPES.includes(t.type)).length}
          </span>
        </button>
      </div>

      <div className="flex gap-4 min-h-[560px]">
        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <button
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
              setNewForm((f) => ({ ...f, type: activeSection === "certificate" ? "certificate" : "offer_letter" }));
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-2xl text-sm font-semibold transition-colors ${activeSection === "certificate" ? "border-amber-300 dark:border-amber-700 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10" : "border-purple-300 dark:border-purple-700 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10"}`}
          >
            <Plus className="w-4 h-4" />New Template
          </button>

          {sectionTemplates.length === 0 && !creating ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No {activeSection === "certificate" ? "certificate" : "internship"} templates yet.
            </div>
          ) : (
            sectionTemplates.map((t) => (
              <button key={t.id} onClick={() => openTemplate(t)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${selectedId === t.id && !creating
                  ? activeSection === "certificate" ? "bg-amber-500 text-white" : "bg-purple-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300"
                }`}>
                <FileText className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{t.name}</p>
                  <p className={`text-[10px] truncate ${selectedId === t.id && !creating ? "opacity-70" : "text-gray-400"}`}>
                    {TYPE_LABELS[t.type]}
                  </p>
                </div>
                {t.is_default && <Star className="w-3 h-3 shrink-0 text-amber-400" />}
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {creating ? (
            <div className="p-6 space-y-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">New {activeSection === "certificate" ? "Certificate" : "Internship"} Template</h3>
                <button onClick={() => setCreating(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Template Name *</label>
                  <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Premium Certificate" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Type</label>
                  <select value={newForm.type} onChange={(e) => setNewType(e.target.value as TemplateType)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {activeSection === "certificate"
                      ? <option value="certificate">Certificate</option>
                      : <>
                          <option value="offer_letter">Offer Letter</option>
                          <option value="completion_letter">Completion Letter</option>
                          <option value="internship_letter">Internship Letter</option>
                        </>}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {vars.map((v) => (
                    <button key={v} type="button" onClick={() => insertVar(v)}
                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono rounded-lg hover:bg-blue-100 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Content *</label>
                <textarea value={newForm.content} onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
                  rows={12} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                  placeholder="Template content with {{variables}}..." />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" />{saving ? "Creating…" : "Create Template"}
                </button>
                <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              </div>
            </div>
          ) : selected ? (
            <div className="flex flex-col h-full">
              {/* Editor header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="font-bold text-gray-900 dark:text-white text-base bg-transparent focus:outline-none border-b-2 border-transparent focus:border-blue-400 px-0 py-0.5" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeSection === "certificate" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                    {TYPE_LABELS[selected.type]}
                  </span>
                  {selected.is_default && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Default</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(selected.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                    <Save className="w-3.5 h-3.5" />{saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
              {/* Variable buttons */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <p className="text-[10px] text-gray-400 mb-2 font-semibold uppercase tracking-wide">Insert Variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {vars.map((v) => (
                    <button key={v} type="button" onClick={() => insertVar(v)}
                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono rounded-lg hover:bg-blue-100 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {/* Content editor */}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 p-5 text-sm font-mono bg-transparent focus:outline-none resize-none text-gray-700 dark:text-gray-300"
                placeholder="Template content..."
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                {activeSection === "certificate"
                  ? <Award className="w-12 h-12 mx-auto text-amber-200 dark:text-amber-900 mb-3" />
                  : <Briefcase className="w-12 h-12 mx-auto text-purple-200 dark:text-purple-900 mb-3" />}
                <p className="text-sm text-gray-400 font-medium">
                  Select a {activeSection === "certificate" ? "certificate" : "letter"} template to edit
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-700 dark:text-amber-300">
          <p className="font-bold mb-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />Certificate Templates</p>
          <p>Used to generate downloadable certificate PDFs. Variables like {`{{student_name}}`} are replaced with real data when certificates are issued.</p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-700 dark:text-purple-300">
          <p className="font-bold mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Internship Letter Templates</p>
          <p>Offer Letter, Completion Letter, and Internship Letter are used for virtual internship products. Assigned per-internship in the Settings tab.</p>
        </div>
      </div>
    </div>
  );
}
