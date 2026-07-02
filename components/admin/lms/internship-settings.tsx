"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Building2, User, FileText, ClipboardList, CheckSquare } from "lucide-react";

interface Props {
  course: any;
  onUpdate: (updated: any) => void;
}

const DEFAULT_OFFER = `Dear {{student_name}},

We are pleased to offer you a Virtual Internship at {{company_name}} for the position of {{internship_title}}.

Internship Duration: {{duration}}
Start Date: {{start_date}}
End Date: {{end_date}}

During this internship, you will work on real-world projects and gain practical experience in {{field}}.

We look forward to having you as part of our team.

Regards,
{{supervisor_name}}
{{company_name}}`;

const DEFAULT_COMPLETION = `Dear {{student_name}},

This is to certify that you have successfully completed your Virtual Internship at {{company_name}} as {{internship_title}}.

Duration: {{duration}}
Completion Date: {{completion_date}}

Throughout this internship, you demonstrated dedication, skills, and professionalism. We wish you all the best in your future endeavors.

Regards,
{{supervisor_name}}
{{company_name}}`;

export function InternshipSettings({ course, onUpdate }: Props) {
  const [form, setForm] = useState({
    company_name: course.company_name || "",
    supervisor_name: course.supervisor_name || "",
    duration: course.duration || "",
    offer_letter_template: course.offer_letter_template || DEFAULT_OFFER,
    completion_letter_template: course.completion_letter_template || DEFAULT_COMPLETION,
    internship_letter_template: course.internship_letter_template || "",
    assignment_required: course.assignment_required || false,
    project_submission_required: course.project_submission_required || false,
    auto_issue_certificate: course.auto_issue_certificate !== false,
  });
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<"offer" | "completion" | "internship">("offer");

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_COURSE_INFO", id: course.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data);
      toast.success("Internship settings saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const VARIABLES = [
    "{{student_name}}", "{{company_name}}", "{{internship_title}}", "{{supervisor_name}}",
    "{{duration}}", "{{start_date}}", "{{end_date}}", "{{completion_date}}", "{{field}}",
  ];

  const templateKey: Record<typeof activeTemplate, keyof typeof form> = {
    offer: "offer_letter_template",
    completion: "completion_letter_template",
    internship: "internship_letter_template",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Internship Settings</h3>
          <p className="text-sm text-gray-500 mt-0.5">Configure internship details and letter templates</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20"
        >
          <Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Company Details */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500" />
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Company Details</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
            <input
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="e.g. ProCerix Technologies"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />Supervisor Name
            </label>
            <input
              value={form.supervisor_name}
              onChange={(e) => set("supervisor_name", e.target.value)}
              placeholder="e.g. Rohan Sharma"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Internship Duration</label>
            <input
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="e.g. 4 weeks / 1 month"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Requirements</h4>
        {[
          { key: "assignment_required", icon: ClipboardList, title: "Assignment Required", desc: "Students must submit an assignment to complete the internship" },
          { key: "project_submission_required", icon: CheckSquare, title: "Project Submission Required", desc: "Students must submit a project for review" },
          { key: "auto_issue_certificate", icon: FileText, title: "Auto-issue Certificates", desc: "Automatically issue internship certificate on completion" },
        ].map(({ key, icon: Icon, title, desc }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set(key, !(form as any)[key])}
              className={`relative rounded-full transition-colors flex-shrink-0`}
              style={{ width: "40px", height: "22px", background: (form as any)[key] ? "#2563eb" : "#d1d5db" }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: (form as any)[key] ? "translateX(19px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Letter Templates */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {([
            { key: "offer", label: "Offer Letter" },
            { key: "completion", label: "Completion Letter" },
            { key: "internship", label: "Internship Letter" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTemplate(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTemplate === t.key ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  const key = templateKey[activeTemplate];
                  set(key as string, ((form as any)[key] || "") + v);
                }}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">Click a variable to insert it into the template. These will be replaced with actual values when letters are generated.</p>
          <textarea
            value={(form as any)[templateKey[activeTemplate]]}
            onChange={(e) => set(templateKey[activeTemplate], e.target.value)}
            rows={14}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}
