import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "../components/LayoutShell";

export const metadata: Metadata = {
  title: "DOGFOOD OS — The Self-Hosted Hackathon Operating System",
  description: "An offline-first, agent-native platform for fair judged events, calibrated scoring, and defensible rankings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAF8] text-slate-900 min-h-screen flex flex-col antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
