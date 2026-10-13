"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ErrorState, Loading } from "@/components/ui";

export function AuthGuard({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { account, loading, loggingOut, error } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !loggingOut && !account && !error) router.replace("/login"); }, [loading, loggingOut, account, error, router]);
  if (error) return <ErrorState message={error} />;
  if (loading || !account) return <Loading />;
  if (adminOnly && account.role !== 1) return <ErrorState message="You do not have permission to manage accounts. Only Admin accounts can access this page." />;
  return children;
}
