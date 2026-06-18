import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speak-Up English",
  description: "Your English school — 100% conversation, flexible schedule.",
};

// Runs before paint so the saved/system theme is applied with no flash. Default
// is dark (the historic look); an explicit saved choice always wins.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
