"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export function AutoGenerateCourse({ query }: { query: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"generating" | "saving" | "redirecting" | "error">("generating");

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      try {
        setStatus("generating");
        const res = await fetch("/api/course-generation/realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
        });
        
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        
        if (!isMounted) return;
        
        setStatus("redirecting");
        
        router.push(`/course/${data.slug}`);
      } catch (err) {
        if (isMounted) setStatus("error");
      }
    }

    generate();

    return () => { isMounted = false; };
  }, [query, router]);

  if (status === "error") {
    return (
      <div className="text-center py-24 bg-white/50 dark:bg-gray-900/30 rounded-3xl border border-red-100 dark:border-red-900/30 backdrop-blur-sm">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Something went wrong while generating the course.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 transition-colors">Try Again</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-950 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-800">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-6 animate-pulse" />
        <h3 className="text-2xl font-bold text-white mb-2">🤖 AI is creating your course...</h3>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Generating premium curriculum, projects, and materials for <strong className="text-white">"{query}"</strong>.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center text-left text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            {status === "generating" ? <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-400" /> : <CheckCircle2 className="w-5 h-5 mr-3 text-green-400" />}
            <span className="flex-1 font-medium text-sm">Designing Curriculum</span>
          </div>
          
          <div className={`flex items-center text-left text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md transition-opacity duration-500 ${status === "generating" ? 'opacity-50' : 'opacity-100'}`}>
            {status === "redirecting" || status === "saving" ? (
              <CheckCircle2 className="w-5 h-5 mr-3 text-green-400" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-400" />
            )}
            <span className="flex-1 font-medium text-sm">Building Course Page</span>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 font-medium">
          Estimated time: 30–40 seconds
        </div>
      </div>
    </div>
  );
}
