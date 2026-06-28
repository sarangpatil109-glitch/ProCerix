"use client";
import { useState, useEffect } from "react";
import { updateResumeAction } from "@/actions/resume";
import { ResumeData } from "@/engines/resume/repository";
import { Save, FileDown, Download, Check, RefreshCw } from "lucide-react";

export function ResumeBuilderClient({ resume, userId }: { resume: ResumeData, userId: string }) {
  const [data, setData] = useState<ResumeData>(resume);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  // Auto-save logic
  useEffect(() => {
    if (saved) return;
    const timeoutId = setTimeout(async () => {
      setSaving(true);
      await updateResumeAction(data.id!, userId, {
        personal_details: data.personal_details,
        education: data.education,
        experience: data.experience,
        projects: data.projects,
        skills: data.skills
      });
      setSaving(false);
      setSaved(true);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [data, saved, userId]);

  const handleChange = (section: string, value: any) => {
    setData(prev => ({ ...prev, [section]: value }));
    setSaved(false);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportDOCX = () => {
    alert("DOCX export requires the 'docx' library. For now, please export as PDF!");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      
      {/* Editor Pane */}
      <div className="w-1/2 overflow-y-auto bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Editor</h1>
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
          
          {/* Personal Details */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold mb-4">Personal Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" className="p-2 border rounded" 
                value={data.personal_details?.name || ''} 
                onChange={e => handleChange('personal_details', { ...data.personal_details, name: e.target.value })} 
              />
              <input type="email" placeholder="Email" className="p-2 border rounded"
                value={data.personal_details?.email || ''} 
                onChange={e => handleChange('personal_details', { ...data.personal_details, email: e.target.value })} 
              />
              <input type="text" placeholder="Phone" className="p-2 border rounded"
                value={data.personal_details?.phone || ''} 
                onChange={e => handleChange('personal_details', { ...data.personal_details, phone: e.target.value })} 
              />
              <input type="text" placeholder="Location" className="p-2 border rounded"
                value={data.personal_details?.location || ''} 
                onChange={e => handleChange('personal_details', { ...data.personal_details, location: e.target.value })} 
              />
              <textarea placeholder="Professional Summary" className="col-span-2 p-2 border rounded h-24"
                value={data.personal_details?.summary || ''} 
                onChange={e => handleChange('personal_details', { ...data.personal_details, summary: e.target.value })} 
              />
            </div>
          </section>

          {/* Experience */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Experience</h2>
              <button onClick={() => handleChange('experience', [...data.experience, {}])} className="text-sm text-blue-600">+ Add</button>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-4 p-4 border rounded relative">
                <button onClick={() => handleChange('experience', data.experience.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500">x</button>
                <div className="grid grid-cols-2 gap-2">
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
                  <textarea placeholder="Description" className="col-span-2 p-2 border rounded" value={exp.description || ''} onChange={e => {
                    const newExp = [...data.experience];
                    newExp[i].description = e.target.value;
                    handleChange('experience', newExp);
                  }} />
                </div>
              </div>
            ))}
          </section>

          {/* Education */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Education</h2>
              <button onClick={() => handleChange('education', [...data.education, {}])} className="text-sm text-blue-600">+ Add</button>
            </div>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-4 p-4 border rounded relative">
                <button onClick={() => handleChange('education', data.education.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500">x</button>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Institution" className="p-2 border rounded" value={edu.institution || ''} onChange={e => {
                    const newEdu = [...data.education];
                    newEdu[i].institution = e.target.value;
                    handleChange('education', newEdu);
                  }} />
                  <input type="text" placeholder="Degree" className="p-2 border rounded" value={edu.degree || ''} onChange={e => {
                    const newEdu = [...data.education];
                    newEdu[i].degree = e.target.value;
                    handleChange('education', newEdu);
                  }} />
                </div>
              </div>
            ))}
          </section>

        </div>
      </div>

      {/* Preview Pane */}
      <div className="w-1/2 bg-gray-200 dark:bg-gray-950 p-8 overflow-y-auto relative print:w-full print:bg-white print:p-0">
        
        <div className="sticky top-0 right-0 z-10 flex justify-end gap-2 mb-4 print:hidden">
          <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 shadow-lg">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleExportDOCX} className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2 shadow-lg">
            <Download className="w-4 h-4" /> DOCX
          </button>
        </div>

        {/* Real-time Document Preview (A4 dimensions roughly) */}
        <div className="bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-[20mm] text-black">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
            <h1 className="text-4xl font-bold uppercase tracking-widest">{data.personal_details?.name || "YOUR NAME"}</h1>
            <div className="mt-2 text-gray-600 flex justify-center gap-4 text-sm">
              <span>{data.personal_details?.email}</span>
              {data.personal_details?.phone && <span>• {data.personal_details?.phone}</span>}
              {data.personal_details?.location && <span>• {data.personal_details?.location}</span>}
            </div>
          </div>

          {/* Summary */}
          {data.personal_details?.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-2">Professional Summary</h2>
              <p className="text-sm">{data.personal_details.summary}</p>
            </div>
          )}

          {/* Experience */}
          {data.experience?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3">Experience</h2>
              <div className="space-y-4">
                {data.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-bold text-md">
                      <span>{exp.role || "Role"}</span>
                      <span>{exp.company || "Company"}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3">Education</h2>
              <div className="space-y-2">
                {data.education.map((edu, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="font-bold">{edu.degree || "Degree"}</span>
                    <span>{edu.institution || "Institution"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
