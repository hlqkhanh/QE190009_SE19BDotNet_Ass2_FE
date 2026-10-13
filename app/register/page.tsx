"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 8 || form.password.length > 128) { setError("Name, valid email and a password of 8–128 characters are required."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try { await api("/api/auth/register", { method: "POST", body: JSON.stringify({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password }) }); router.replace("/login?registered=1"); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="page mx-auto max-w-lg"><section className="card p-6"><p className="eyebrow">Join your team</p><h1 className="page-title mb-5">Register</h1><form onSubmit={submit} className="grid gap-4"><label className="label">Full Name<input className="field" required maxLength={100} autoComplete="name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label><label className="label">Email<input className="field" type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label className="label">Password<input className="field" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><span className="help-text">Use 8–128 characters.</span></label><label className="label">Confirm Password<input className="field" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></label>{error && <p role="alert" className="text-red-700">{error}</p>}<button disabled={busy} className="btn btn-primary">{busy ? "Creating account..." : "Register"}</button></form><p className="mt-5 text-sm">Already registered? <Link className="font-bold text-[var(--brand)]" href="/login">Login</Link></p></section></div>;
}
