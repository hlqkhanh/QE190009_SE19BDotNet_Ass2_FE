import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskly — Team workspace",
  description: "Plan projects and manage tasks in Kanban, timeline, and list views.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning><AuthProvider><AppShell>{children}</AppShell></AuthProvider></body>
    </html>
  );
}
