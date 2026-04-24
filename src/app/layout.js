import "./globals.css";
import Providers from "./components/Providers";
import Link from "next/link";

export const metadata = {
  title: "VoiceTicket",
  description: "Instantly convert audio feedback into structured Jira tasks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400&family=Space+Grotesk:wght@400;600;700&family=Spline+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary overflow-hidden h-screen flex flex-col bg-background-dark text-slate-100">
        <Providers>
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
          <footer className="h-10 border-t border-primary/10 bg-background-dark/95 flex items-center justify-center gap-8 text-xs text-slate-500 z-50 shrink-0">
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
