"use client";

import { Globe, EyeOff, AlertCircle, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  course: any;
  modules: any[];
  quizzes: any[];
  onPublish: () => void;
  publishing: boolean;
}

interface Check { label: string; pass: boolean; detail: string }

export function ContentAudit({ course, modules, quizzes, onPublish, publishing }: Props) {
  const [scheduling, setScheduling] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const router = useRouter();

  const isCert = course.course_type === "certificates" || course.course_type === "certificate";
  const totalLessons = modules.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0);
  const totalMCQs = quizzes.reduce((a: number, q: any) => a + (q.questions?.length || 0), 0);

  const certChecks: Check[] = [
    { label: "4–5 Modules", pass: modules.length >= 4 && modules.length <= 5, detail: `${modules.length} module${modules.length !== 1 ? "s" : ""} (need 4–5)` },
    { label: "4–5 Articles", pass: totalLessons >= 4 && totalLessons <= 5, detail: `${totalLessons} article${totalLessons !== 1 ? "s" : ""} (need 4–5)` },
    { label: "Exactly 10 MCQs", pass: totalMCQs === 10, detail: `${totalMCQs} MCQ${totalMCQs !== 1 ? "s" : ""} (need exactly 10)` },
    { label: "No Video Modules", pass: true, detail: "Article-only content ✓" },
    { label: "Has Title", pass: !!course.title?.trim(), detail: course.title ? `"${course.title}"` : "Title is missing" },
    { label: "Has Description", pass: !!(course.description?.trim() || course.short_description?.trim()), detail: "Product description required" },
    { label: "Has Price Set", pass: course.price > 0, detail: `₹${course.price || 0}` },
  ];

  const internChecks: Check[] = [
    { label: "7–8 Modules", pass: modules.length >= 7 && modules.length <= 8, detail: `${modules.length} module${modules.length !== 1 ? "s" : ""} (need 7–8)` },
    { label: "7–8 Articles", pass: totalLessons >= 7 && totalLessons <= 8, detail: `${totalLessons} article${totalLessons !== 1 ? "s" : ""} (need 7–8)` },
    { label: "Exactly 20 MCQs", pass: totalMCQs === 20, detail: `${totalMCQs} MCQ${totalMCQs !== 1 ? "s" : ""} (need exactly 20)` },
    { label: "No Video Modules", pass: true, detail: "Article-only content ✓" },
    { label: "Has Title", pass: !!course.title?.trim(), detail: course.title ? `"${course.title}"` : "Title is missing" },
    { label: "Has Description", pass: !!(course.description?.trim() || course.short_description?.trim()), detail: "Product description required" },
    { label: "Has Price Set", pass: course.price > 0, detail: `₹${course.price || 0}` },
    { label: "Company Name", pass: !!course.company_name?.trim(), detail: course.company_name || "Missing in Settings tab" },
    { label: "Has Assignment (optional)", pass: true, detail: `Assignment required: ${course.assignment_required ? "Yes" : "No"}` },
  ];

  const checks = isCert ? certChecks : internChecks;
  const allPassed = checks.every((c) => c.pass);
  const failedCount = checks.filter((c) => !c.pass).length;

  const handleSchedule = async () => {
    if (!schedDate) { toast.error("Select a date and time"); return; }
    setScheduling(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SCHEDULE_PUBLISH", id: course.id, scheduled_publish_at: new Date(schedDate).toISOString() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Scheduled for publish");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setScheduling(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Archive this product? It will be unpublished and hidden from students.")) return;
    try {
      await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ARCHIVE_COURSE", id: course.id }),
      });
      toast.success("Archived");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Content Audit</h3>
        <p className="text-sm text-gray-500 mt-0.5">Validate your product before publishing</p>
      </div>

      {/* Overall status */}
      <div className={`rounded-2xl border-2 p-6 text-center ${allPassed ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-700" : "border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700"}`}>
        {allPassed ? (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">PASSED</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">All {checks.length} checks passed. Ready to publish!</p>
          </>
        ) : (
          <>
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-xl font-black text-amber-700 dark:text-amber-300">NOT READY</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{failedCount} of {checks.length} checks failed</p>
          </>
        )}
      </div>

      {/* Checklist */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
            {isCert ? "Certificate" : "Internship"} Requirements
          </h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              {c.pass
                ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${c.pass ? "text-gray-900 dark:text-white" : "text-red-700 dark:text-red-400"}`}>{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.detail}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${c.pass ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                {c.pass ? "PASS" : "FAIL"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current status */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${course.is_published ? "bg-emerald-500" : course.lms_status === "archived" ? "bg-gray-400" : "bg-amber-500"}`} />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white capitalize">
                {course.lms_status === "archived" ? "Archived" : course.is_published ? "Published" : "Draft"}
              </p>
              {course.scheduled_publish_at && !course.is_published && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />Scheduled: {new Date(course.scheduled_publish_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={onPublish}
              disabled={publishing || !allPassed}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 ${
                course.is_published
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                  : allPassed
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              {course.is_published ? <><EyeOff className="w-4 h-4" />Unpublish</> : <><Globe className="w-4 h-4" />Publish Now</>}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule publish */}
      {!course.is_published && allPassed && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Schedule Publish</h4>
          </div>
          <div className="flex gap-3">
            <input
              type="datetime-local"
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSchedule}
              disabled={scheduling || !schedDate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {scheduling ? "Scheduling..." : "Schedule"}
            </button>
          </div>
          <p className="text-xs text-gray-400">The product will automatically publish at the selected date and time.</p>
        </div>
      )}
    </div>
  );
}
