"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Building2, CheckSquare2, FolderKanban, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, Empty, ErrorState, Loading } from "@/components/ui";
import { TaskViews } from "@/components/task-views";
import type { Department, Project, TaskItem } from "@/types";

export default function Home() {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: TaskItem[] }>();
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api<Department[]>("/api/departments"), api<Project[]>("/api/projects"), api<TaskItem[]>("/api/tasks")])
      .then(([departments, projects, tasks]) => setData({ departments, projects, tasks }))
      .catch((reason) => setError(reason.message));
  }, []);
  const stats = useMemo(() => {
    if (!data) return null;
    const completed = data.tasks.filter((task) => task.status === 2).length;
    const overdue = data.tasks.filter((task) => task.status < 2 && task.dueDate && new Date(`${task.dueDate}T23:59:59`) < new Date()).length;
    return { completed, overdue, rate: data.tasks.length ? Math.round(completed / data.tasks.length * 100) : 0 };
  }, [data]);
  if (error) return <ErrorState message={error} />;
  if (!data || !stats) return <Loading />;

  const metrics = [
    { label: "Departments", value: data.departments.length, note: "Active departments", icon: Building2, color: "bg-[#eef1ff] text-[#5865d8]" },
    { label: "Projects", value: data.projects.length, note: "Active projects", icon: FolderKanban, color: "bg-[#eeeaff] text-[#6a55c2]" },
    { label: "Tasks", value: data.tasks.length, note: `${stats.completed} completed · ${stats.rate}%`, icon: CheckSquare2, color: "bg-[#e7f7f2] text-[#19866d]" },
    { label: "Overdue", value: stats.overdue, note: "Open tasks past due", icon: AlertTriangle, color: "bg-[#fff4dc] text-[#a36216]" },
  ];

  return <div className="page">
    <section className="overview-banner">
      <div><p className="eyebrow">Public task management</p><h1 className="page-title">Workspace overview</h1><p className="page-description">Review departments, active projects, and task progress from one place.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/search" className="btn btn-secondary"><Search size={16} />Search tasks</Link><Link href="/admin/tasks" className="btn btn-primary">Manage tasks <ArrowRight size={16} /></Link></div>
    </section>

    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary counts">{metrics.map(({ label, value, note, icon: Icon, color }) => <div key={label} className="card metric-card"><div className="flex items-start justify-between"><div><p className="metric-label">{label}</p><p className="metric-value">{value}</p></div><span className={`metric-icon ${color}`}><Icon size={17} /></span></div><p className="metric-note">{note}</p></div>)}</section>

    <section className="mb-7" aria-label="Active projects">
      <div className="section-heading"><div><h2>Active projects</h2><p>Select a project to review its details and related tasks.</p></div><Link href="/admin/projects" className="btn btn-ghost">Manage projects <ArrowRight size={16} /></Link></div>
      {data.projects.length === 0 ? <div className="card"><Empty>No active projects yet.</Empty></div> : <div className="grid gap-x-3 gap-y-4 md:grid-cols-2 xl:grid-cols-3">{data.projects.map((project, index) => <Link href={`/projects/${project.projectId}`} key={project.projectId} className={`folder-card ${["folder-lilac", "folder-mint", "folder-sky", "folder-sand", "folder-coral", "folder-lime"][index % 6]}`}><div className="relative z-10 mb-3 flex items-start justify-between gap-3"><span className="folder-card-icon"><FolderKanban size={17} /></span><Badge value={project.status} kind="project" /></div><h3 className="relative z-10 font-extrabold tracking-[-.01em]">{project.projectName}</h3><p className="relative z-10 mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--text-soft)]">{project.description || "No description provided."}</p><div className="folder-card-divider relative z-10 mt-3 flex items-center gap-2 border-t pt-2.5 text-xs font-bold text-[var(--text-soft)]"><Building2 size={13} />{project.departmentName}</div></Link>)}</div>}
    </section>

    <section aria-label="Task board">
      <div className="section-heading"><div><h2>Task board</h2><p>The same status board used in Task Management, shown here as a read-only overview.</p></div><Link href="/admin/tasks" className="btn btn-ghost">Open task management <ArrowRight size={16} /></Link></div>
      <TaskViews items={data.tasks} view="kanban" maxPerStatus={3} />
    </section>
  </div>;
}
