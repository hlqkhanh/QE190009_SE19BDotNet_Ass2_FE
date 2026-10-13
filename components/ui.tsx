"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AlertCircle, Check, CheckCircle2, Circle, Clock3, LoaderCircle, TriangleAlert, X, type LucideIcon } from "lucide-react";

const projectMeta: { label: string; className: string; icon: LucideIcon }[] = [
  { label: "Not started", className: "bg-[#f1f2f4] text-[#44546f]", icon: Circle },
  { label: "In progress", className: "bg-[#e9f2ff] text-[#0055cc]", icon: Clock3 },
  { label: "Completed", className: "bg-[#dffcf0] text-[#216e4e]", icon: Check },
  { label: "On hold", className: "bg-[#fff7d6] text-[#974f0c]", icon: AlertCircle },
];
const taskMeta: { label: string; className: string; icon: LucideIcon }[] = [
  { label: "To do", className: "bg-[#f1f2f4] text-[#44546f]", icon: Circle },
  { label: "In progress", className: "bg-[#e9f2ff] text-[#0055cc]", icon: Clock3 },
  { label: "Done", className: "bg-[#dffcf0] text-[#216e4e]", icon: Check },
  { label: "Cancelled", className: "bg-[#ffeceb] text-[#ae2e24]", icon: X },
];
const priorityMeta = [
  { label: "Low", className: "bg-[#e9f2ff] text-[#0c66e4]" },
  { label: "Medium", className: "bg-[#eae6ff] text-[#5e4db2]" },
  { label: "High", className: "bg-[#fff7d6] text-[#974f0c]" },
  { label: "Critical", className: "bg-[#ffeceb] text-[#ae2e24]" },
];

export function Badge({ value, kind }: { value: number; kind: "project" | "task" | "priority" }) {
  if (kind === "priority") { const item = priorityMeta[value] || priorityMeta[0]; return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold ${item.className}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{item.label}</span>; }
  const item = (kind === "project" ? projectMeta : taskMeta)[value] || projectMeta[0]; const Icon = item.icon;
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold ${item.className}`}><Icon size={12} strokeWidth={2.6}/>{item.label}</span>;
}

export function Loading() {
  return <div className="page" aria-live="polite" aria-busy="true"><div className="mb-8 space-y-3"><div className="skeleton h-3 w-24 rounded"/><div className="skeleton h-9 w-64 rounded-lg"/><div className="skeleton h-4 w-96 max-w-full rounded"/></div><div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(x => <div key={x} className="card p-5"><div className="skeleton mb-6 h-9 w-9 rounded-lg"/><div className="skeleton mb-3 h-5 w-2/3 rounded"/><div className="skeleton h-3 w-full rounded"/></div>)}</div><span className="sr-only">Loading content</span></div>;
}

export function InlineLoading({ label = "Loading…" }: { label?: string }) { return <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#626f86]"><LoaderCircle size={16} className="animate-spin" />{label}</span>; }

export function ErrorState({ message }: { message: string }) { return <div className="page"><div className="card flex items-start gap-3 border-[#f5b7b1] bg-[#fff5f4] p-5 text-[#ae2e24]"><TriangleAlert className="mt-0.5 shrink-0" size={20}/><div><p className="font-extrabold">Something went wrong</p><p className="mt-1 text-sm leading-6">{message}</p></div></div></div>; }

export function Empty({ children = "No records found.", action }: { children?: ReactNode; action?: ReactNode }) { return <div className="grid min-h-48 place-items-center p-8 text-center"><div><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#f1f2f4] text-[#626f86]"><CheckCircle2 size={21}/></div><p className="font-bold text-[#44546f]">{children}</p>{action && <div className="mt-4">{action}</div>}</div></div>; }

export function Toast({ message, error = false }: { message: string; error?: boolean }) {
  const [dismissedMessage, setDismissedMessage] = useState("");
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setDismissedMessage(message), 4200); return () => window.clearTimeout(timer); }, [message]);
  if (!message || dismissedMessage === message) return null;
  return <div role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"} className={`fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-2xl [animation:toast-in_.2s_ease-out] ${error ? "bg-[#ae2e24]" : "bg-[#216e4e]"}`}>{error ? <TriangleAlert size={19} className="shrink-0"/> : <CheckCircle2 size={19} className="shrink-0"/>}<span className="leading-5">{message}</span><button aria-label="Dismiss notification" onClick={() => setDismissedMessage(message)} className="ml-2 rounded p-0.5 opacity-80 hover:bg-white/15 hover:opacity-100"><X size={16}/></button></div>;
}

export function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId();
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-[#091e42]/55 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#dfe1e6] bg-white shadow-[0_20px_60px_rgba(9,30,66,.28)]" onMouseDown={e => e.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#ebecf0] bg-white px-6 py-5"><div><h2 id={titleId} className="text-xl font-extrabold tracking-[-.02em] text-[#172b4d]">{title}</h2>{description && <p className="mt-1 text-sm text-[#626f86]">{description}</p>}</div><button aria-label="Close dialog" onClick={onClose} className="icon-btn -mr-2 -mt-1"><X size={20}/></button></header><div className="p-6">{children}</div>
    </section>
  </div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Delete", busy = false, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel?: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <Modal title={title} description="This action requires confirmation." onClose={busy ? () => undefined : onCancel}><div className="flex gap-3 rounded-xl bg-[#fff5f4] p-4 text-[#ae2e24]"><TriangleAlert size={21} className="mt-0.5 shrink-0"/><p className="text-sm leading-6">{description}</p></div><div className="mt-6 flex justify-end gap-3"><button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button><button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy && <LoaderCircle size={16} className="animate-spin"/>}{confirmLabel}</button></div></Modal>;
}
