import { ClientProviders } from "@/components/providers/client-providers";
import "./globals.css";

export const metadata = {
  title: "DevArise AI — Master Coding. Ace Interviews. Land Your Dream Role.",
  description: "DevArise AI is the ultimate AI-powered platform for coding practice, mock interviews, personalized roadmaps, and career growth for developers.",
  keywords: "coding practice, AI interview, placement roadmap, DSA, full stack developer, tech career",
  authors: [{ name: "DevArise AI" }],
  openGraph: {
    title: "DevArise AI — AI-Powered Developer Career Platform",
    description: "Master coding, ace interviews, build your portfolio and land your dream role with DevArise AI.",
    type: "website",
  },
  themeColor: "#7c3aed",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background selection:bg-violet-500/20 antialiased selection:text-white">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
