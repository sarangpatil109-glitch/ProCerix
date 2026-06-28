import { ReactNode } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30">
      <MarketingHeader />
      <main className="flex-1 pt-20 flex flex-col overflow-x-hidden">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
