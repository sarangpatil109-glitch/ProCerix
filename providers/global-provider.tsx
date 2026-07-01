"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button";

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <WhatsAppButton />
    </ThemeProvider>
  );
}
