import { createClient } from "@/lib/supabase/server";
import { GovernanceClient } from "./GovernanceClient";
import { Database, Zap, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

export default async function AIGovernanceDashboard() {
  const supabase = await createClient();

  // Fetch Metrics
  const { data: metrics } = await supabase.from("ai_cost_metrics").select("*");
  const { data: pauseSetting } = await supabase.from("ai_governance_settings").select("value").eq("key", "generation_paused").single();

  const totalCalls = metrics?.length || 0;
  const reusedCalls = metrics?.filter(m => m.was_reused).length || 0;
  const generatedCalls = totalCalls - reusedCalls;
  const totalCost = metrics?.reduce((sum, m) => sum + Number(m.estimated_cost_usd), 0) || 0;
  const totalPromptTokens = metrics?.reduce((sum, m) => sum + Number(m.prompt_tokens), 0) || 0;
  const totalCompletionTokens = metrics?.reduce((sum, m) => sum + Number(m.completion_tokens), 0) || 0;
  
  const genTimes = metrics?.filter(m => !m.was_reused).map(m => m.generation_time_ms) || [];
  const avgGenTime = genTimes.length > 0 ? (genTimes.reduce((a, b) => a + b, 0) / genTimes.length / 1000).toFixed(2) : "0.00";

  const isPaused = pauseSetting?.value === true;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> AI Governance & Cost Control
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Monitor AI generation metrics, enforce limits, and track infrastructure costs.</p>
        </div>
        <GovernanceClient initialPaused={isPaused} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-sm uppercase">Total AI Cost</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">${totalCost.toFixed(4)}</div>
          <p className="text-xs text-gray-400 mt-2">Estimated lifetime spending</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <RefreshCw className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-sm uppercase">Duplicate Saves</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">{reusedCalls}</div>
          <p className="text-xs text-gray-400 mt-2">Generations skipped via caching</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Database className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-sm uppercase">Tokens Processed</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">{(totalPromptTokens + totalCompletionTokens).toLocaleString()}</div>
          <p className="text-xs text-gray-400 mt-2">Prompt: {totalPromptTokens} | Completion: {totalCompletionTokens}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-sm uppercase">Avg. Latency</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">{avgGenTime}s</div>
          <p className="text-xs text-gray-400 mt-2">Per successful AI generation</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-900 dark:text-white">Generation Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Skill</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Cost</th>
                <th className="px-6 py-4 font-semibold">Latency</th>
                <th className="px-6 py-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {metrics?.slice(0, 50).map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{m.skill_name}</td>
                  <td className="px-6 py-4">
                    {m.was_reused ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">REUSED</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">GENERATED</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">${Number(m.estimated_cost_usd).toFixed(4)}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{m.was_reused ? "-" : `${(m.generation_time_ms / 1000).toFixed(1)}s`}</td>
                  <td className="px-6 py-4 text-gray-500 text-right">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {(!metrics || metrics.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No generation history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
