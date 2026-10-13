"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { ErrorState, Loading } from "@/components/ui";

const sections = ["departments", "projects", "tasks", "tags"];
export default function Dashboard() {
  const { account } = useAuth();
  const [counts, setCounts] = useState<number[]>();
  const [error, setError] = useState("");
  useEffect(() => { Promise.all(sections.map(section => api<unknown[]>(`/api/${section}`))).then(data => setCounts(data.map(items => items.length))).catch(error => setError(error.message)); }, []);
  if (error) return <ErrorState message={error} />;
  if (!counts) return <Loading />;
  return <div className="page"><div className="page-header"><div><p className="eyebrow">Management workspace</p><h1 className="page-title">Welcome, {account?.fullName}</h1><p className="page-description">Manage your teams, projects and tasks.</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{sections.map((section, index) => <Link key={section} href={`/admin/${section}`} className="card p-6"><h2 className="capitalize font-bold">{section}</h2><p className="my-3 text-3xl font-extrabold">{counts[index]}</p><span className="text-sm text-[var(--brand)]">Manage {section} →</span></Link>)}</div>{account?.role === 1 && <Link className="btn btn-primary mt-6" href="/admin/accounts">Manage accounts</Link>}</div>;
}
