import { createClient } from "@/lib/supabase/server";
import { User, Shield, Search, Ban } from "lucide-react";
import { UserActions } from "@/components/admin/users/user-actions";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, admin_users(id)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Management</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage all registered users on the platform.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-gray-900 dark:border-gray-800" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {profiles?.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-500">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.admin_users?.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : user.is_suspended ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <Ban className="w-3 h-3" /> Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      Student
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-4">
                  <UserActions userId={user.id} isSuspended={user.is_suspended || false} />
                  <button className="text-sm text-blue-600 font-medium hover:underline">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
