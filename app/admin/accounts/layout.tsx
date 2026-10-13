import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
export default function AccountsLayout({ children }: { children: ReactNode }) { return <AuthGuard adminOnly>{children}</AuthGuard>; }
