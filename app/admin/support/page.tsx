import { MessageSquare, Search } from "lucide-react";

export default function AdminSupportPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Support Requests</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage contact requests, feedback, and bug reports.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tickets..." className="pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-gray-900 dark:border-gray-800" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Tickets</h3>
        <p className="text-gray-500">All support requests have been resolved.</p>
      </div>
    </div>
  );
}
