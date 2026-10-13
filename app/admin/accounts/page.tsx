"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { expireSession, readSession, updateSessionAccount } from "@/lib/session";
import { ConfirmDialog, ErrorState, Loading, Modal, Toast } from "@/components/ui";
import type { Account } from "@/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(); const [error, setError] = useState("");
  const [editing, setEditing] = useState<Account | null>(null); const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [form, setForm] = useState({ fullName: "", role: 0 }); const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ message: "", error: false });
  const load = useCallback(() => api<Account[]>("/api/accounts").then(items => { setAccounts(items); setError(""); }).catch(error => setError(error.message)), []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!editing || !form.fullName.trim()) return; setBusy(true);
    try {
      await api(`/api/accounts/${editing.accountId}`, { method: "PUT", body: JSON.stringify(form) });
      if (readSession()?.account.accountId === editing.accountId) {
        if (form.role !== editing.role) { expireSession(); return; }
        updateSessionAccount({ ...editing, fullName: form.fullName.trim() });
      }
      setEditing(null); setToast({ message: "Account updated.", error: false }); await load();
    } catch (error) { setToast({ message: (error as Error).message, error: true }); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!pendingDelete) return; setBusy(true);
    try {
      await api(`/api/accounts/${pendingDelete.accountId}`, { method: "DELETE" });
      if (readSession()?.account.accountId === pendingDelete.accountId) { expireSession(); return; }
      setPendingDelete(null); setToast({ message: "Account deleted.", error: false }); await load();
    } catch (error) { setToast({ message: (error as Error).message, error: true }); }
    finally { setBusy(false); }
  };
  if (error) return <ErrorState message={error} />; if (!accounts) return <Loading />;
  return <div className="page"><div className="page-header"><div><p className="eyebrow">Admin only</p><h1 className="page-title">Accounts</h1><p className="page-description">Manage names and roles. Accounts that created tasks cannot be deleted.</p></div></div><div className="card table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead><tbody>{accounts.map(account => <tr key={account.accountId}><td>{account.fullName}</td><td>{account.email}</td><td>{account.role === 1 ? "Admin" : "Staff"}</td><td>{new Date(account.createdDate).toLocaleDateString()}</td><td><div className="flex gap-2"><button className="btn btn-secondary" onClick={() => { setEditing(account); setForm({ fullName: account.fullName, role: account.role }); }}>Edit</button><button className="btn btn-danger" onClick={() => setPendingDelete(account)}>Delete</button></div></td></tr>)}</tbody></table></div>{editing && <Modal title="Edit account" onClose={() => { if (!busy) setEditing(null); }}><form onSubmit={submit} className="grid gap-4"><label className="label">Full Name<input className="field" required maxLength={100} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label><label className="label">Role<select className="field" value={form.role} onChange={e => setForm({ ...form, role: Number(e.target.value) })}><option value={0}>Staff</option><option value={1}>Admin</option></select></label><p className="help-text">Changing a role ends all sessions for this account.</p><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save account"}</button></form></Modal>}<ConfirmDialog open={Boolean(pendingDelete)} title="Delete account?" description={`Delete ${pendingDelete?.fullName}? This also revokes their sessions.`} busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={remove} /><Toast {...toast} /></div>;
}
