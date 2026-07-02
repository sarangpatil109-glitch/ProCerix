"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, BookOpen, FileText, HelpCircle, Award, Clock, BarChart2, Star } from "lucide-react";

interface Props {
  course: any;
  modules: any[];
  quizzes: any[];
}

const VIEWPORTS = [
  { key: "desktop", icon: Monitor, label: "Desktop", width: "100%" },
  { key: "tablet", icon: Tablet, label: "Tablet", width: "768px" },
  { key: "mobile", icon: Smartphone, label: "Mobile", width: "390px" },
] as const;

export function ProductPreview({ course, modules, quizzes }: Props) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const totalLessons = modules.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0);
  const totalMCQs = quizzes.reduce((a: number, q: any) => a + (q.questions?.length || 0), 0);
  const isCert = course.course_type === "certificates" || course.course_type === "certificate";

  const vp = VIEWPORTS.find((v) => v.key === viewport)!;
  const isNarrow = viewport !== "desktop";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Preview</h3>
          <p className="text-sm text-gray-500 mt-0.5">See how students will view this product</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              onClick={() => setViewport(v.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewport === v.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <v.icon className="w-3.5 h-3.5" />{v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex justify-center bg-gray-100 dark:bg-gray-950 rounded-2xl p-4 min-h-[600px] overflow-auto">
        <div
          className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
          style={{ width: vp.width, maxWidth: "100%", minWidth: isNarrow ? undefined : "640px" }}
        >
          {/* Hero */}
          <div className="relative" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}>
            {course.thumbnail_url && (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover opacity-30 absolute inset-0" />
            )}
            <div className="relative z-10 px-6 py-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isCert ? "bg-amber-400/20 text-amber-200" : "bg-purple-400/20 text-purple-200"}`}>
                  {isCert ? "🏆 Certificate" : "💼 Virtual Internship"}
                </span>
              </div>
              <h1 className={`font-black text-white leading-tight ${isNarrow ? "text-xl" : "text-2xl"}`}>
                {course.title || "Course Title"}
              </h1>
              {(course.short_description || course.description) && (
                <p className={`text-blue-100 mt-2 leading-relaxed ${isNarrow ? "text-xs" : "text-sm"}`}>
                  {(course.short_description || course.description)?.slice(0, 120)}…
                </p>
              )}

              <div className={`flex flex-wrap gap-3 mt-4 ${isNarrow ? "text-xs" : "text-sm"}`}>
                {[
                  { icon: BookOpen, val: `${modules.length} Modules` },
                  { icon: FileText, val: `${totalLessons} Articles` },
                  { icon: HelpCircle, val: `${totalMCQs} MCQs` },
                ].map(({ icon: Icon, val }) => (
                  <span key={val} className="flex items-center gap-1 text-blue-100">
                    <Icon className="w-3.5 h-3.5" />{val}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Price + CTA */}
          <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center ${isNarrow ? "flex-col gap-3" : "justify-between"}`}>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`font-black text-gray-900 dark:text-white ${isNarrow ? "text-2xl" : "text-3xl"}`}>
                  ₹{course.price || 0}
                </span>
                {course.old_price > 0 && (
                  <span className="text-gray-400 line-through text-sm">₹{course.old_price}</span>
                )}
              </div>
              {course.old_price > 0 && (
                <span className="text-emerald-600 text-xs font-bold">
                  {Math.round(((course.old_price - course.price) / course.old_price) * 100)}% OFF
                </span>
              )}
            </div>
            <button className={`bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors ${isNarrow ? "w-full py-3 text-sm" : "px-8 py-3 text-sm"}`}>
              Enroll Now
            </button>
          </div>

          {/* Stats row */}
          <div className={`grid border-b border-gray-100 dark:border-gray-800 ${isNarrow ? "grid-cols-2" : "grid-cols-4"}`}>
            {[
              { icon: Clock, label: "Duration", val: course.duration || "Self-paced" },
              { icon: BarChart2, label: "Difficulty", val: course.difficulty || "Beginner" },
              { icon: Star, label: "Language", val: course.language || "English" },
              { icon: Award, label: isCert ? "Certificate" : "Internship", val: isCert ? "Included" : "Letter Included" },
            ].slice(0, isNarrow ? 2 : 4).map(({ icon: Icon, label, val }) => (
              <div key={label} className="px-4 py-3 text-center border-r last:border-r-0 border-gray-100 dark:border-gray-800">
                <Icon className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Modules list */}
          <div className="px-6 py-4">
            <h3 className={`font-bold text-gray-900 dark:text-white mb-3 ${isNarrow ? "text-sm" : "text-base"}`}>
              Course Content
            </h3>
            <div className="space-y-2">
              {modules.length === 0 ? (
                <div className="text-center py-8 text-gray-300 dark:text-gray-700">
                  <BookOpen className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No modules yet</p>
                </div>
              ) : modules.map((m, i) => (
                <div key={m.id} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className={`font-semibold text-gray-800 dark:text-gray-200 flex-1 ${isNarrow ? "text-xs" : "text-sm"}`}>{m.title || `Module ${i + 1}`}</p>
                    <span className="text-xs text-gray-400">{m.lessons?.length || 0} article{(m.lessons?.length || 0) !== 1 ? "s" : ""}</span>
                  </div>
                  {(m.lessons || []).slice(0, 3).map((l: any, j: number) => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                      <FileText className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                      <p className={`text-gray-600 dark:text-gray-400 flex-1 ${isNarrow ? "text-xs" : "text-xs"}`}>{l.title || `Article ${j + 1}`}</p>
                      {l.estimated_reading_time && (
                        <span className="text-xs text-gray-300 dark:text-gray-600">{l.estimated_reading_time} min</span>
                      )}
                    </div>
                  ))}
                  {(m.lessons || []).length > 3 && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-400">+{(m.lessons || []).length - 3} more articles</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Outcomes */}
          {(course.learning_outcomes?.length > 0) && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className={`font-bold text-gray-900 dark:text-white mb-3 ${isNarrow ? "text-sm" : "text-base"}`}>What You'll Learn</h3>
              <div className={`grid gap-2 ${isNarrow ? "grid-cols-1" : "grid-cols-2"}`}>
                {(course.learning_outcomes || []).map((o: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{o}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz section preview */}
          {totalMCQs > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className={`font-bold text-gray-900 dark:text-white ${isNarrow ? "text-xs" : "text-sm"}`}>Final Assessment</p>
                  <p className="text-xs text-gray-500">{totalMCQs} Questions · {course.passing_percentage || 70}% to pass</p>
                </div>
              </div>
            </div>
          )}

          {/* Certificate/Internship badge */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className={`flex items-center gap-3 p-3 rounded-xl ${isCert ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800" : "bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800"}`}>
              <span className="text-2xl">{isCert ? "🏆" : "💼"}</span>
              <div>
                <p className={`font-bold text-xs ${isCert ? "text-amber-700 dark:text-amber-300" : "text-purple-700 dark:text-purple-300"}`}>
                  {isCert ? "Earn a Verified Certificate" : "Get an Internship Letter"}
                </p>
                <p className="text-xs text-gray-500">
                  {isCert
                    ? "Showcase your skills with a sharable credential"
                    : "Receive an official internship completion certificate"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              Enroll for ₹{course.price || 0}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
