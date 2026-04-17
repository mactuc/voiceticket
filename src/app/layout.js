import "./globals.css";

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
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary overflow-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
