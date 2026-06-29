import { createAdminClient } from "@/lib/supabase/admin";
import { CreditCard, Search } from "lucide-react";

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Orders</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage all purchases and refunds.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search orders by ID..." className="pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-gray-900 dark:border-gray-800" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments?.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-xs">{payment.cashfree_order_id}</div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {payment.profiles?.first_name} {payment.profiles?.last_name}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {payment.skill_name || "Unknown"}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                  ₹{payment.amount}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm text-blue-600 font-medium hover:underline">View Invoice</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
