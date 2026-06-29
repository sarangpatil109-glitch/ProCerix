"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

export function AIGenerateButton({ query }: { query: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleGenerate = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/course-generation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        <h4 className="text-lg font-bold text-green-900 dark:text-green-100">Request Sent Successfully!</h4>
        <p className="text-green-700 dark:text-green-400 mt-2 text-center max-w-md">
          Our AI is generating a curriculum for "{query}". It will be reviewed by our team and published shortly. You can track this in your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button 
        onClick={handleGenerate}
        disabled={status === "loading"}
        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        Generate this course using AI
      </button>
      {status === "error" && (
        <p className="text-red-500 mt-4 text-sm font-medium">Failed to submit request. Please try again later.</p>
      )}
    </div>
  );
}
