import { Toaster } from "@/components/ui/sonner";
import { ChatBot } from "@/components/chatbot";
import { CommandMenu } from "@/components/command-menu";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <title>DevArise AI — Master Coding. Ace Interviews. Land Your Dream Role.</title>
        <meta
          name="description"
          content="DevArise AI is the ultimate AI-powered platform for coding practice, mock interviews, personalized roadmaps, and career growth for developers."
        />
        <meta name="keywords" content="coding practice, AI interview, placement roadmap, DSA, full stack developer, tech career" />
        <meta name="author" content="DevArise AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="DevArise AI — AI-Powered Developer Career Platform" />
        <meta property="og:description" content="Master coding, ace interviews, build your portfolio and land your dream role with DevArise AI." />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background selection:bg-violet-500/20 antialiased selection:text-white">
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
      </body>
    </html>
  );
}
