"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CommandMenu } from "@/components/command-menu";
import { ChatBot } from "@/components/chatbot";

export function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <div className="relative min-h-screen flex flex-col">
          <CommandMenu />
          {children}
          <ChatBot />
          <Toaster position="top-right" closeButton richColors theme="dark" expand={true} />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

