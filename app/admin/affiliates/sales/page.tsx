"use client";

import { useEffect, useState, useCallback } from "react";

export default function AdminAffiliateSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates/sales");
      if (res.ok) setSales((await res.json()).sales || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalComm = sales.filter(s => s.payment_status === "completed").reduce((sum, s) => sum + Number(s.commission_amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Affiliate Sales</h1>
        <p className="text-gray-500 mt-1">{sales.length} transactions · ₹{totalComm.toFixed(2)} total commission</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {sales.length === 0 ? (
            <div className="py-16 text-center text-gray-400"><p className="font-semibold">No sales yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Date", "Affiliate", "Coupon", "Sale Amount", "Commission", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{s.affiliate_profiles?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{s.affiliate_profiles?.email || "—"}</p>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-blue-600">{s.coupon_code}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">₹{Number(s.purchase_amount).toFixed(2)}</td>
                      <td className="px-5 py-3 font-bold text-green-600">₹{Number(s.commission_amount).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.payment_status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {s.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
