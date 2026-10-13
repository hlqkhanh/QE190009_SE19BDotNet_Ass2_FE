"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Building2, Settings2, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Empty, ErrorState, Loading } from "@/components/ui";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const [items,setItems]=useState<Department[]>();const [error,setError]=useState("");useEffect(()=>{api<Department[]>("/api/departments").then(setItems).catch(e=>setError(e.message));},[]);
  if(error)return <ErrorState message={error}/>;if(!items)return <Loading/>;
  return <div className="page"><div className="page-header"><div><p className="eyebrow">Organization</p><h1 className="page-title">Departments</h1><p className="page-description">Browse the teams responsible for every active project in the workspace.</p></div><Link href="/admin/departments" className="btn btn-secondary"><Settings2 size={17}/>Manage departments</Link></div>
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#b3d4ff] bg-[#e9f2ff] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[#0c66e4]"><Users size={19}/></span><div><p className="text-sm font-extrabold text-[#0055cc]">{items.length} active teams</p><p className="mt-0.5 text-xs leading-5 text-[#44546f]">Select a department to see its active project portfolio.</p></div></div>
    {items.length===0?<div className="card"><Empty>No active departments yet.</Empty></div>:<div className="grid gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item,index)=><Link key={item.departmentId} href={`/departments/${item.departmentId}`} className={`folder-card group ${["folder-sky","folder-lilac","folder-mint","folder-sand","folder-coral","folder-lime"][index%6]}`}><div className="relative z-10 mb-3 flex items-start justify-between"><span className="folder-card-icon"><Building2 size={18}/></span><ArrowUpRight size={17} className="folder-card-arrow"/></div><p className="relative z-10 text-[11px] font-bold text-[var(--text-soft)]">DEP-{String(item.departmentId).padStart(3,"0")}</p><h2 className="relative z-10 mt-1 text-base font-extrabold tracking-[-.02em]">{item.departmentName}</h2><p className="relative z-10 mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--text-soft)]">{item.departmentDescription}</p><div className="folder-card-divider relative z-10 mt-3 border-t pt-2.5 text-xs font-bold text-[var(--text)]">Explore projects</div></Link>)}</div>}
  </div>;
}
