"use client";
import { useState, useEffect } from "react";
import { updateLinkedInAction, aiRewriteLinkedInAction } from "@/actions/linkedin";
import { LinkedInProfileData } from "@/engines/linkedin/repository";
import { Check, RefreshCw, Wand2, Copy } from "lucide-react";

export function LinkedInBuilderClient({ profile, userId }: { profile: LinkedInProfileData, userId: string }) {
  const [data, setData] = useState<LinkedInProfileData>(profile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Auto-save logic
  useEffect(() => {
    if (saved) return;
    const timeoutId = setTimeout(async () => {
      setSaving(true);
      await updateLinkedInAction(data.id!, userId, {
        basic_info: data.basic_info,
        headline: data.headline,
        about: data.about,
        experience: data.experience,
        skills: data.skills,
        custom_url: data.custom_url
      });
      setSaving(false);
      setSaved(true);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [data, saved, userId]);

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleAIRewrite = async (text: string, type: "headline" | "about" | "experience", index?: number) => {
    const key = `${type}-${index ?? 0}`;
    setAiLoading(key);
    const res = await aiRewriteLinkedInAction(text, type);
    if (res.success && res.text) {
      if (type === "headline") handleChange("headline", res.text);
      if (type === "about") handleChange("about", res.text);
      if (type === "experience" && typeof index === "number") {
        const newExp = [...data.experience];
        newExp[index].description = res.text;
        handleChange("experience", newExp);
      }
    }
    setAiLoading(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      
      {/* Editor Pane */}
      <div className="w-1/2 overflow-y-auto bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LinkedIn Optimizer</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {saving ? (
              <span className="flex items-center gap-1"><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</span>
            ) : saved ? (
              <span className="flex items-center gap-1 text-green-600"><Check className="w-4 h-4" /> Saved</span>
            ) : (
              <span className="flex items-center gap-1">Unsaved changes</span>
            )}
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Custom URL */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold mb-4">Custom URL</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">linkedin.com/in/</span>
              <input type="text" placeholder="your-name" className="p-2 border rounded flex-1"
                value={data.custom_url || ''} 
                onChange={e => handleChange('custom_url', e.target.value)} 
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">A custom URL improves your professional appearance and ATS discoverability.</p>
          </section>

          {/* Headline */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Headline</h2>
              <button 
                onClick={() => handleAIRewrite(data.headline, "headline")}
                disabled={!data.headline || !!aiLoading}
                className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium hover:bg-purple-200 disabled:opacity-50"
              >
                <Wand2 className="w-3 h-3" /> AI Optimize
              </button>
            </div>
            <textarea placeholder="Product Manager | Data-Driven Strategist | Building SaaS Products" className="w-full p-2 border rounded h-20"
              value={data.headline || ''} 
              onChange={e => handleChange('headline', e.target.value)} 
            />
            <button onClick={() => copyToClipboard(data.headline)} className="mt-2 text-sm text-blue-600 flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy to LinkedIn
            </button>
          </section>

          {/* About */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">About Section</h2>
              <button 
                onClick={() => handleAIRewrite(data.about, "about")}
                disabled={!data.about || !!aiLoading}
                className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium hover:bg-purple-200 disabled:opacity-50"
              >
                <Wand2 className="w-3 h-3" /> AI Optimize
              </button>
            </div>
            <textarea placeholder="Write a compelling summary of your career journey..." className="w-full p-2 border rounded h-32"
              value={data.about || ''} 
              onChange={e => handleChange('about', e.target.value)} 
            />
             <button onClick={() => copyToClipboard(data.about)} className="mt-2 text-sm text-blue-600 flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy to LinkedIn
            </button>
          </section>

          {/* Experience */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Experience Bullets</h2>
              <button onClick={() => handleChange('experience', [...data.experience, {}])} className="text-sm text-blue-600 font-bold">+ Add Role</button>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-6 p-4 border rounded relative bg-gray-50 dark:bg-gray-900/50">
                <button onClick={() => handleChange('experience', data.experience.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500">x</button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input type="text" placeholder="Company" className="p-2 border rounded" value={exp.company || ''} onChange={e => {
                    const newExp = [...data.experience];
                    newExp[i].company = e.target.value;
                    handleChange('experience', newExp);
                  }} />
                  <input type="text" placeholder="Role" className="p-2 border rounded" value={exp.role || ''} onChange={e => {
                    const newExp = [...data.experience];
                    newExp[i].role = e.target.value;
                    handleChange('experience', newExp);
                  }} />
                </div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <span className="text-sm font-medium">Description Bullets</span>
                  <button 
                    onClick={() => handleAIRewrite(exp.description, "experience", i)}
                    disabled={!exp.description || !!aiLoading}
                    className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium hover:bg-purple-200 disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3" /> Optimize Bullets
                  </button>
                </div>
                <textarea placeholder="Describe your achievements..." className="w-full p-2 border rounded h-24" value={exp.description || ''} onChange={e => {
                  const newExp = [...data.experience];
                  newExp[i].description = e.target.value;
                  handleChange('experience', newExp);
                }} />
                 <button onClick={() => copyToClipboard(exp.description)} className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Copy Bullets
                </button>
              </div>
            ))}
          </section>

        </div>
      </div>

      {/* Optimization Report Pane */}
      <div className="w-1/2 bg-white dark:bg-gray-950 p-8 overflow-y-auto border-l border-gray-200 dark:border-gray-800">
        
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <h2 className="text-xl font-bold mb-2">Profile Strength</h2>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-black">{data.profile_score || 0}</span>
            <span className="text-blue-100 mb-1">/ 100</span>
          </div>
          <div className="w-full bg-blue-900/50 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${data.profile_score || 0}%` }}></div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Optimization Checklist</h3>
        <div className="space-y-4">
          <ChecklistItem title="Custom URL" checked={data.custom_url?.length > 5} desc="Creates a clean, professional link." />
          <ChecklistItem title="Headline Impact" checked={data.headline?.length > 20 && (data.headline.includes('|') || data.headline.includes('-'))} desc="Use keywords separated by | or -." />
          <ChecklistItem title="Comprehensive About" checked={data.about?.length > 200} desc="Write at least a 200 character summary." />
          <ChecklistItem title="Detailed Experience" checked={data.experience?.length > 0 && data.experience.some(e => e.description?.length > 50)} desc="Add robust bullet points to roles." />
          <ChecklistItem title="Core Skills" checked={data.skills?.length >= 5} desc="List at least 5 top skills." />
        </div>

        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">How to use this optimizer?</h3>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
            <li>Paste your existing content into the editor.</li>
            <li>Click <strong>AI Optimize</strong> to rewrite and enhance your text.</li>
            <li>Review the changes and tweak as necessary.</li>
            <li>Click <strong>Copy to LinkedIn</strong> and paste directly into your profile.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}

function ChecklistItem({ title, checked, desc }: { title: string, checked: boolean, desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className={`p-1 rounded-full mt-0.5 ${checked ? 'bg-green-100 text-green-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
        <Check className="w-4 h-4" />
      </div>
      <div>
        <h4 className={`font-bold ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{title}</h4>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}
