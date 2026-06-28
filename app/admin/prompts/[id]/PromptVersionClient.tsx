"use client";
import { useState } from "react";
import { CheckCircle, Plus, Copy, Play } from "lucide-react";

export function PromptVersionClient({ template, initialVersions }: { template: any, initialVersions: any[] }) {
  const [versions, setVersions] = useState(initialVersions);
  const [activeTab, setActiveTab] = useState(versions[0]?.id || "");
  const [editingContent, setEditingContent] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Test Variables
  const [testVars, setTestVars] = useState({ skill: "Python", course_type: template.type, module_count: 3, lesson_count: 10, mcq_count: 10, task_count: 3 });
  const [preview, setPreview] = useState("");

  const activeVersion = versions.find(v => v.id === activeTab);

  const handleSelectVersion = (id: string) => {
    setActiveTab(id);
    const ver = versions.find(v => v.id === id);
    if (ver) setEditingContent(ver.content);
    setPreview("");
  };

  const handleCreateVersion = async () => {
    setSaving(true);
    const maxVer = Math.max(...versions.map(v => v.version_number), 0);
    const newVer = {
      template_id: template.id,
      version_number: maxVer + 1,
      content: editingContent || "New Prompt...",
      is_active: false
    };

    const res = await fetch("/api/admin/crud", {
      method: "POST",
      body: JSON.stringify({ entity: "prompt_versions", action: "CREATE", payload: newVer })
    });
    const data = await res.json();
    setVersions([data, ...versions]);
    handleSelectVersion(data.id);
    setSaving(false);
  };

  const handleActivate = async (id: string) => {
    // Requires a custom API to deactivate others and activate this, or handle transaction.
    // For now we will hit a dedicated route or do it in two steps.
    const res = await fetch("/api/admin/prompts/activate", {
      method: "POST",
      body: JSON.stringify({ version_id: id, template_id: template.id })
    });
    if (res.ok) {
       setVersions(versions.map(v => ({ ...v, is_active: v.id === id })));
    }
  };

  const handleUpdateContent = async () => {
    setSaving(true);
    await fetch("/api/admin/crud", {
      method: "POST",
      body: JSON.stringify({ entity: "prompt_versions", action: "UPDATE", id: activeVersion.id, payload: { content: editingContent } })
    });
    setVersions(versions.map(v => v.id === activeVersion.id ? { ...v, content: editingContent } : v));
    setSaving(false);
    alert("Saved!");
  };

  const generatePreview = () => {
    let result = editingContent;
    Object.entries(testVars).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
    setPreview(result);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {versions.map(v => (
            <button
              key={v.id}
              onClick={() => handleSelectVersion(v.id)}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === v.id ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              v{v.version_number} {v.is_active && <CheckCircle className={`w-4 h-4 ${activeTab === v.id ? "text-white" : "text-green-500"}`} />}
            </button>
          ))}
          <button onClick={handleCreateVersion} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> New Version
          </button>
        </div>

        {activeVersion && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Editing v{activeVersion.version_number}
                {activeVersion.is_active && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full ml-2">ACTIVE</span>}
              </span>
              <div className="flex items-center gap-2">
                {!activeVersion.is_active && (
                  <button onClick={() => handleActivate(activeVersion.id)} className="px-4 py-1.5 text-sm font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    Make Active
                  </button>
                )}
                <button onClick={handleUpdateContent} disabled={saving} className="px-4 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                  {saving ? "Saving..." : "Save Content"}
                </button>
              </div>
            </div>
            <textarea
              className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none text-gray-900 dark:text-gray-100 font-mono text-sm"
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              placeholder="Enter your prompt here..."
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-500" /> Test Variables
          </h3>
          <div className="space-y-3 mb-6">
            {Object.keys(testVars).map(key => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{key}</label>
                <input 
                  type="text" 
                  value={(testVars as any)[key]} 
                  onChange={(e) => setTestVars({...testVars, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
          <button onClick={generatePreview} className="w-full py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold rounded-xl transition-colors text-sm">
            Generate Preview
          </button>
        </div>

        {preview && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Rendered Output</h3>
              <button onClick={() => navigator.clipboard.writeText(preview)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {preview}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
