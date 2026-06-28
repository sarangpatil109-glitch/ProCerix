"use client";
import { useState } from "react";
import { Play, Pause } from "lucide-react";

export function GovernanceClient({ initialPaused }: { initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);
  const [loading, setLoading] = useState(false);

  const togglePause = async () => {
    setLoading(true);
    const newState = !paused;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      body: JSON.stringify({ 
         entity: "ai_governance_settings", 
         action: "UPDATE", 
         primaryKey: "key",
         id: "generation_paused", 
         payload: { value: newState } 
      })
    });
    
    if (res.ok) {
      setPaused(newState);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      {paused && (
        <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 font-bold text-sm rounded-full animate-pulse">
          GENERATION PAUSED
        </span>
      )}
      <button 
        onClick={togglePause} 
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
          paused 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        {paused ? "Resume Generation" : "Pause Generation"}
      </button>
    </div>
  );
}
