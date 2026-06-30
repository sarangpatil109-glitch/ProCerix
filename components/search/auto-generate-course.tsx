"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { analyticsGenerateCourse, analyticsGenerateInternship } from "@/lib/analytics";
import { trackEvent } from "@/lib/clarity";

export function AutoGenerateCourse({ query, type }: { query: string; type?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "generating" | "saving" | "redirecting" | "error">("idle");

  useEffect(() => {
    if (status !== "generating") return;

    let isMounted = true;

    async function generate() {
      try {
        const res = await fetch("/api/course-generation/realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, type: type || "certificate" })
        });

        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();

        if (!isMounted) return;

        setStatus("redirecting");

        // Route based on content type returned by the API
        if (data.type === "internship") {
          trackEvent("ai_internship_generated");
          router.push(`/internship/${data.slug}`);
        } else {
          trackEvent("ai_course_generated");
          router.push(`/course/${data.slug}`);
        }
      } catch (err) {
        if (isMounted) setStatus("error");
      }
    }

    generate();

    return () => { isMounted = false; };
  }, [status, query, type, router]);

  const isInternship = type === "internship";

  if (status === "idle") {
    return (
      <div className="text-center py-24 bg-white/50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No {isInternship ? "internship" : "course"} found.
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          However, our AI can generate a custom {isInternship ? "virtual internship" : "curriculum"} for exactly what you're looking for.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (isInternship) { analyticsGenerateInternship(query); trackEvent("generate_internship_ai"); }
              else { analyticsGenerateCourse(query); trackEvent("generate_course_ai"); }
              setStatus("generating");
            }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Generate {isInternship ? "Internship" : "Course"} with AI
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-24 bg-white/50 dark:bg-gray-900/30 rounded-3xl border border-red-100 dark:border-red-900/30 backdrop-blur-sm">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Something went wrong while generating the {isInternship ? "internship" : "course"}.</p>
        <button onClick={() => setStatus("idle")} className="px-6 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 transition-colors">Try Again</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-950 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-800">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-6 animate-pulse" />
        <h3 className="text-2xl font-bold text-white mb-2">
          🤖 AI is creating your {isInternship ? "internship" : "course"}...
        </h3>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Generating premium {isInternship ? "internship tasks and materials" : "curriculum, projects, and materials"} for <strong className="text-white">"{query}"</strong>.
        </p>

        <div className="space-y-3">
          <div className="flex items-center text-left text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            {status === "generating" ? <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-400" /> : <CheckCircle2 className="w-5 h-5 mr-3 text-green-400" />}
            <span className="flex-1 font-medium text-sm">{isInternship ? "Designing Tasks" : "Designing Curriculum"}</span>
          </div>

          <div className={`flex items-center text-left text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md transition-opacity duration-500 ${status === "generating" ? 'opacity-50' : 'opacity-100'}`}>
            {status === "redirecting" || status === "saving" ? (
              <CheckCircle2 className="w-5 h-5 mr-3 text-green-400" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-400" />
            )}
            <span className="flex-1 font-medium text-sm">Building {isInternship ? "Internship" : "Course"} Page</span>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500 font-medium">
          Estimated time: 30–40 seconds
        </div>
      </div>
    </div>
  );
}
