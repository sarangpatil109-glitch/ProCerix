import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "sonner";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use the service role client so RLS cannot block the admin-status lookup.
  const adminDb = createAdminClient();
  const { data: adminUser } = await adminDb.from("admin_users").select("role").eq("id", user.id).single();
  if (!adminUser) notFound();

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 shrink-0 shadow-sm z-10">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
