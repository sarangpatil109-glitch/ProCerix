import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

import { ProductRegistry } from "@/engines/registry/product-registry";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const products = ProductRegistry.getAllProducts();
  const accessibleProducts = products;

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30 overflow-hidden">
      <DashboardSidebar accessibleProducts={accessibleProducts} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 shrink-0 shadow-sm z-10 lg:hidden">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 relative">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
