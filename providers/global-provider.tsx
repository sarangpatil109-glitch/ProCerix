"use client";

import { ThemeProvider } from "@/providers/theme-provider";

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
