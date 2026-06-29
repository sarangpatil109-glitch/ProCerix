import { AnalyticsService } from "@/services/analytics-service";
import { 
  Users, DollarSign, Award, Briefcase, FileText, 
  Share2, Cpu, BookOpen, AlertCircle, CheckCircle2, XCircle, TrendingUp
} from "lucide-react";
import { RevenueChart } from "@/components/admin/charts";

export default async function AdminDashboard() {
  const metrics = await AnalyticsService.getDashboardMetrics();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Business Overview</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Real-time performance metrics for ProCerix.</p>
      </div>

      {/* Revenue & Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue" value={`₹${metrics.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-emerald-600" />} trend="All time" />
        <MetricCard title="Today's Revenue" value={`₹${metrics.todayRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-emerald-600" />} trend="Last 24h" />
        <MetricCard title="Total Users" value={metrics.totalUsers} icon={<Users className="w-5 h-5 text-blue-600" />} trend="Registered" />
        <MetricCard title="Certificates Issued" value={metrics.certificates} icon={<Award className="w-5 h-5 text-yellow-600" />} trend="Completed" />
      </div>
      
      {/* Sales Graph */}
      <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Revenue Overview</h3>
            <p className="text-sm text-gray-500">Monthly revenue for the current year</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
            <TrendingUp className="w-4 h-4" />
            +14.5%
          </div>
        </div>
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Overview */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Product Performance</h3>
          <div className="space-y-6">
            <ProductStat title="Published Courses" value={metrics.publishedCourses} icon={<BookOpen className="w-5 h-5" />} color="bg-blue-100 text-blue-600" />
            <ProductStat title="Draft Courses" value={metrics.draftCourses} icon={<FileText className="w-5 h-5" />} color="bg-gray-100 text-gray-600" />
            <ProductStat title="Internships Completed" value={metrics.internshipsCompleted} icon={<Briefcase className="w-5 h-5" />} color="bg-purple-100 text-purple-600" />
            <ProductStat title="Resume Builder Purchases" value={metrics.resumePurchases} icon={<FileText className="w-5 h-5" />} color="bg-pink-100 text-pink-600" />
            <ProductStat title="LinkedIn Optimizer Purchases" value={metrics.linkedinPurchases} icon={<Share2 className="w-5 h-5" />} color="bg-indigo-100 text-indigo-600" />
          </div>
        </div>

        {/* AI & Payments Overview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">AI Generation Engine</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-500">Queue Size</span>
                </div>
                <div className="text-3xl font-black">{metrics.pendingGenerations}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-gray-500">Failed</span>
                </div>
                <div className="text-3xl font-black text-red-600">{metrics.failedGenerations}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Payments Engine</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-500">Successful</span>
                </div>
                <div className="text-3xl font-black text-green-700 dark:text-green-500">{metrics.successfulPaymentsCount}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-500">Failed</span>
                </div>
                <div className="text-3xl font-black text-red-700 dark:text-red-500">{metrics.failedPaymentsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {metrics.recentActivity.map((activity: any) => (
                  <tr key={activity.id}>
                    <td className="py-4 font-medium text-gray-900 dark:text-white">
                      {activity.profiles?.first_name} {activity.profiles?.last_name}
                    </td>
                    <td className="py-4 font-bold text-gray-900 dark:text-white">₹{activity.amount}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${activity.status === 'success' ? 'bg-green-100 text-green-700' : activity.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {metrics.recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">No recent activity.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {metrics.recentUsers.map((user: any) => (
                  <tr key={user.id}>
                    <td className="py-4 font-medium text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-4 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {metrics.recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">No recent users.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">{icon}</div>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60">
        <span className="text-xs font-medium text-gray-500">{trend}</span>
      </div>
    </div>
  );
}

function ProductStat({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <span className="font-semibold text-gray-700 dark:text-gray-300">{title}</span>
      </div>
      <span className="font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
