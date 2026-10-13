"use client";
import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Session } from "@/types";

export default function LoginPage() {
  return <Suspense fallback={<div className="page">Loading...</div>}><LoginForm /></Suspense>;
}
function LoginForm() {
  const { login, account, loading, loggingOut, error: sessionError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const registered = useSearchParams().get("registered") === "1";
  useEffect(() => {
    if (account && !loading && !loggingOut && !sessionError) router.replace("/admin");
  }, [account, loading, loggingOut, sessionError, router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { login(await api<Session>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) })); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  if (loading || account) return <div className="page" role="status" aria-live="polite">{account ? "Opening your dashboard..." : "Verifying your session..."}</div>;
  return <div className="page mx-auto max-w-lg"><section className="card p-6"><p className="eyebrow">Welcome back</p><h1 className="page-title mb-5">Login</h1>{registered && <p role="status" className="mb-4 text-green-700">Registration successful. Please log in.</p>}<form onSubmit={submit} className="grid gap-4"><label className="label">Email<input className="field" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="label">Password<input className="field" type="password" required maxLength={128} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>{(error || sessionError) && <p role="alert" className="text-red-700">{error || sessionError}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? "Logging in..." : "Login"}</button></form><p className="mt-5 text-sm">Need an account? <Link className="font-bold text-[var(--brand)]" href="/register">Register</Link></p></section></div>;
}
