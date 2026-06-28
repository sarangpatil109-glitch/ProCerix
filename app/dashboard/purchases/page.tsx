import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "@/services/payment-service";
import { redirect } from "next/navigation";
import { CreditCard, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payments = await PaymentService.getUserPayments(user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Purchase History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Track all your ProCerix subscriptions and one-time purchases.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Product / Course</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments?.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{payment.skill_name || payment.courses?.title || "ProCerix Product"}</div>
                        <div className="text-xs capitalize text-gray-500">{payment.courses?.course_type || "Product"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {payment.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : payment.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium text-xs">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button disabled={payment.status !== 'success'} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                      <FileText className="w-4 h-4" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
              
              {(!payments || payments.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No purchase history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
