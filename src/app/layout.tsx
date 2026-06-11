import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speak-Up English",
  description: "Your English school — 100% conversation, flexible schedule.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
