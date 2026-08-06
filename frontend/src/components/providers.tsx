"use client";

import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";

// Heuristic #1: Visibility of System Status — toast notifications for all actions
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </SessionProvider>
  );
}
