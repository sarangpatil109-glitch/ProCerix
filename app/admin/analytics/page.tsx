import { RevenueChart, UsersChart } from "@/components/admin/charts";
import { TrendingUp, Users } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Deep dive into revenue, users, and platform growth.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Revenue Trends</h3>
              <p className="text-sm text-gray-500">Monthly revenue for the current year</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
              <TrendingUp className="w-4 h-4" />
              +14.5%
            </div>
          </div>
          <RevenueChart />
        </div>

        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">User Registrations</h3>
              <p className="text-sm text-gray-500">New signups per month</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
              <Users className="w-4 h-4" />
              +8.2%
            </div>
          </div>
          <UsersChart />
        </div>
      </div>
    </div>
  );
}
