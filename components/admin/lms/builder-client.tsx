"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft, Info, Layers, ClipboardList, Settings, CheckSquare, Eye,
  Globe, EyeOff,
} from "lucide-react";
import { InfoTab } from "./info-tab";
import { ModuleBuilder } from "./module-builder";
import { QuizBuilder } from "./quiz-builder";
import { CertificateSettings } from "./certificate-settings";
import { InternshipSettings } from "./internship-settings";
import { ContentAudit } from "./content-audit";
import { ProductPreview } from "./product-preview";

type Tab = "info" | "modules" | "quiz" | "settings" | "audit" | "preview";

interface Props {
  course: any;
  initialModules: any[];
  initialQuizzes: any[];
}

export function BuilderClient({ course: initialCourse, initialModules, initialQuizzes }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [course, setCourse] = useState(initialCourse);
  const [modules, setModules] = useState(initialModules);
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  const isCert = course.course_type === "certificates" || course.course_type === "certificate";
  const isInternship = course.course_type === "internship";

  const handlePublishToggle = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PUBLISH_COURSE", id: course.id, is_published: !course.is_published }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      setCourse(updated);
      toast.success(updated.is_published ? "Published!" : "Moved to Draft");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const onCourseUpdate = useCallback((updated: any) => setCourse(updated), []);
  const onModulesChange = useCallback((mods: any[]) => setModules(mods), []);
  const onQuizzesChange = useCallback((qzs: any[]) => setQuizzes(qzs), []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "info",     label: "Info",     icon: Info },
    { id: "modules",  label: "Modules",  icon: Layers },
    { id: "quiz",     label: "Quiz",     icon: ClipboardList },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "audit",    label: "Audit",    icon: CheckSquare },
    { id: "preview",  label: "Preview",  icon: Eye },
  ];

  const totalMCQs = quizzes.reduce((acc: number, qz: any) => acc + (qz.questions?.length || 0), 0);
  const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);

  return (
    <div className="space-y-0 -m-6 md:-m-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/lms" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{course.title}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span className="capitalize">{isCert ? "Certificate" : "Internship"}</span>
              <span>·</span>
              <span>{modules.length} modules</span>
              <span>·</span>
              <span>{totalLessons} articles</span>
              <span>·</span>
              <span>{totalMCQs} MCQs</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${course.is_published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
            {course.is_published ? "Published" : "Draft"}
          </span>
          <button
            onClick={handlePublishToggle}
            disabled={publishing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 ${
              course.is_published
                ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            }`}
          >
            {course.is_published ? <><EyeOff className="w-4 h-4" />Unpublish</> : <><Globe className="w-4 h-4" />Publish</>}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === "quiz" && totalMCQs > 0 && (
                <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {totalMCQs}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {activeTab === "info" && (
            <InfoTab course={course} onUpdate={onCourseUpdate} />
          )}
          {activeTab === "modules" && (
            <ModuleBuilder courseId={course.id} modules={modules} onChange={onModulesChange} />
          )}
          {activeTab === "quiz" && (
            <QuizBuilder courseId={course.id} modules={modules} quizzes={quizzes} onChange={onQuizzesChange} />
          )}
          {activeTab === "settings" && isCert && (
            <CertificateSettings course={course} onUpdate={onCourseUpdate} />
          )}
          {activeTab === "settings" && isInternship && (
            <InternshipSettings course={course} onUpdate={onCourseUpdate} />
          )}
          {activeTab === "audit" && (
            <ContentAudit
              course={course}
              modules={modules}
              quizzes={quizzes}
              onPublish={handlePublishToggle}
              publishing={publishing}
            />
          )}
          {activeTab === "preview" && (
            <ProductPreview course={course} modules={modules} quizzes={quizzes} />
          )}
        </div>
      </div>
    </div>
  );
}
