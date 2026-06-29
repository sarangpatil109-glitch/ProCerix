import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30 overflow-hidden w-full max-w-[100vw]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full max-w-full">
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0 p-4 md:p-6 lg:p-10 relative w-full">
          <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
