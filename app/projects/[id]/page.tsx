"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, FolderKanban, KanbanSquare, List, Settings2, Timeline } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import { Badge, ErrorState, Loading } from "@/components/ui";
import { TaskViews, type TaskView } from "@/components/task-views";
import type { Project } from "@/types";

const views: { value: TaskView; label: string; icon: typeof List }[] = [
  { value: "kanban", label: "Kanban", icon: KanbanSquare },
  { value: "timeline", label: "Timeline", icon: Timeline },
  { value: "list", label: "List", icon: List },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Project>();
  const [error, setError] = useState("");
  const [view, setView] = useState<TaskView>("list");

  useEffect(() => {
    api<Project>(`/api/projects/${id}`).then(setItem).catch((requestError) => setError(requestError.message));
  }, [id]);

  const done = useMemo(() => item?.tasks?.filter((task) => task.status === 2).length || 0, [item]);

  if (error) return <ErrorState message={error} />;
  if (!item) return <Loading />;

  const tasks = item.tasks || [];
  const total = tasks.length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return <div className="page project-detail-page">
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link href={`/departments/${item.departmentId}`} className="btn btn-ghost -ml-3"><ArrowLeft size={17} />{item.departmentName}</Link>
      <Link href="/admin/projects" className="btn btn-secondary"><Settings2 size={16} />Manage projects</Link>
    </div>

    <section className="card p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex flex-1 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#eae6ff] text-[#5e4db2]"><FolderKanban size={20} /></span>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2"><p className="eyebrow">Project · PRJ-{String(item.projectId).padStart(3, "0")}</p><Badge value={item.status} kind="project" /></div>
            <h1 className="text-2xl font-extrabold tracking-[-.035em]">{item.projectName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#626f86]">{item.description || "No description provided."}</p>
          </div>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2">
          <div className="rounded-[10px] bg-[#f7f8f9] p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#626f86]"><CalendarDays size={14} />Timeline</p>
            <p className="mt-1.5 text-sm font-extrabold">{formatDate(item.startDate)}</p>
            <p className="text-xs text-[#626f86]">to {formatDate(item.endDate)}</p>
          </div>
          <div className="rounded-[10px] bg-[#f7f8f9] p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#626f86]"><Building2 size={14} />Department</p>
            <p className="mt-1.5 text-sm font-extrabold">{item.departmentName}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-[#ebecf0] pt-4">
        <div className="mb-2 flex justify-between text-xs font-bold"><span>Task completion</span><span>{done} of {total} · {progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[#ebecf0]"><div className="h-full rounded-full bg-[#1f845a] transition-all" style={{ width: `${progress}%` }} /></div>
      </div>
    </section>

    <section className="project-tasks-section">
      <div className="project-tasks-heading">
        <div><h2>Project tasks</h2><p>{total} active {total === 1 ? "task" : "tasks"} in this project.</p></div>
        <Link href="/admin/tasks" className="btn btn-ghost">Manage tasks <ArrowRight size={16} /></Link>
      </div>
      <div className="project-view-bar">
        <div className="view-tabs" role="tablist" aria-label="Project task view">
          {views.map(({ value, label, icon: Icon }) => <button key={value} role="tab" aria-selected={view === value} className={view === value ? "active" : ""} onClick={() => setView(value)}><Icon size={16} />{label}</button>)}
        </div>
      </div>
      <TaskViews items={tasks} view={view} />
    </section>
  </div>;
}
