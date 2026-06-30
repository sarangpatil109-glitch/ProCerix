"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";

export default function AdminAffiliateProfilesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) setAffiliates((await res.json()).affiliates || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    const res = await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) { toast.success(`Status updated to ${newStatus}`); load(); }
    else toast.error("Update failed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Affiliates</h1>
          <p className="text-gray-500 mt-1">{affiliates.length} affiliate{affiliates.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : affiliates.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No affiliates yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Name", "Coupon", "Commission", "Discount", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {affiliates.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.email || "—"}</p>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-blue-600">{a.coupon_code}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{a.commission_percentage}%</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {a.discount_type === "flat" ? `₹${a.discount_value}` : `${a.discount_value}%`}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleStatus(a.id, a.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          a.status === "active"
                            ? "bg-red-50 hover:bg-red-100 text-red-600"
                            : "bg-green-50 hover:bg-green-100 text-green-600"
                        }`}
                      >
                        {a.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
