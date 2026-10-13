"use client";
import { useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { expireSession, updateSessionAccount } from "@/lib/session";
import { Toast } from "@/components/ui";
import type { Account } from "@/types";

export default function ProfilePage() { return <AuthGuard><ProfileForm /></AuthGuard>; }
function ProfileForm() {
  const { account } = useAuth(); const [name, setName] = useState(account?.fullName || "");
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false); const [toast, setToast] = useState({ message: "", error: false });
  const saveName = async (event: FormEvent) => {
    event.preventDefault(); if (!name.trim()) return; setBusy(true);
    try { updateSessionAccount(await api<Account>("/api/auth/profile", { method: "PUT", body: JSON.stringify({ fullName: name.trim() }) })); setToast({ message: "Profile updated.", error: false }); }
    catch (error) { setToast({ message: (error as Error).message, error: true }); } finally { setBusy(false); }
  };
  const savePassword = async (event: FormEvent) => {
    event.preventDefault(); if (password.newPassword !== password.confirm) { setToast({ message: "Passwords do not match.", error: true }); return; }
    setBusy(true);
    try { await api("/api/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }) }); expireSession(); }
    catch (error) { setToast({ message: (error as Error).message, error: true }); } finally { setBusy(false); }
  };
  return <div className="page max-w-3xl"><h1 className="page-title mb-5">Profile</h1><p className="mb-5">{account?.email} · {account?.role === 1 ? "Admin" : "Staff"}</p><section className="card p-6 mb-5"><h2 className="text-lg font-bold mb-4">Your name</h2><form onSubmit={saveName} className="grid gap-4"><label className="label">Full Name<input required maxLength={100} className="field" value={name} onChange={e => setName(e.target.value)} /></label><button disabled={busy} className="btn btn-primary">Save name</button></form></section><section className="card p-6"><h2 className="text-lg font-bold mb-4">Change password</h2><p className="help-text mb-4">All sessions will end after your password changes.</p><form onSubmit={savePassword} className="grid gap-4"><label className="label">Current Password<input type="password" required maxLength={128} autoComplete="current-password" className="field" value={password.currentPassword} onChange={e => setPassword({ ...password, currentPassword: e.target.value })} /></label><label className="label">New Password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field" value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })} /></label><label className="label">Confirm Password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} /></label><button disabled={busy} className="btn btn-primary">Change password</button></form></section><Toast {...toast} /></div>;
}
