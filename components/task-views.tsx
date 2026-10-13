"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, Circle, Clock3, Pencil, Trash2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/api";
import type { TaskItem } from "@/types";
import { Badge, Empty } from "@/components/ui";

export type TaskView = "kanban" | "timeline" | "list";

type Props = {
  items: TaskItem[];
  view: TaskView;
  onEdit?: (item: TaskItem) => void;
  onDelete?: (item: TaskItem) => void;
  maxPerStatus?: number;
};

const statuses = [
  { value: 0, label: "To do", icon: Circle, color: "#64748b", headerBackground: "#eef2f7", headerBorder: "#d7dee8" },
  { value: 1, label: "In progress", icon: Clock3, color: "#635bff", headerBackground: "#eeecff", headerBorder: "#d5d0ff" },
  { value: 2, label: "Done", icon: CheckCircle2, color: "#16856b", headerBackground: "#e4f5ef", headerBorder: "#bfe4d7" },
  { value: 3, label: "Cancelled", icon: XCircle, color: "#d14b52", headerBackground: "#fff0f1", headerBorder: "#f1c9cd" },
] as const;

function TaskTags({ task }: { task: TaskItem }) {
  if (!task.tags.length) return null;
  return <div className="task-tags">{task.tags.map((tag) => <span key={tag.tagId} style={{ backgroundColor: `${tag.color || "#697386"}18`, color: tag.color || "#697386" }}>{tag.tagName}</span>)}</div>;
}

function Actions({ task, onEdit, onDelete }: { task: TaskItem; onEdit?: Props["onEdit"]; onDelete?: Props["onDelete"] }) {
  if (!onEdit || !onDelete) return null;
  return <div className="row-actions">
    <button className="icon-btn" title="Edit task" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}><Pencil size={15} /></button>
    <button className="icon-btn danger-icon" title="Archive task" aria-label={`Archive ${task.title}`} onClick={() => onDelete(task)}><Trash2 size={15} /></button>
  </div>;
}

export function TaskViews({ items, view, onEdit, onDelete, maxPerStatus }: Props) {
  if (!items.length) return <div className="workspace-panel"><Empty>No tasks match the current filters.</Empty></div>;
  if (view === "kanban") return <Kanban items={items} onEdit={onEdit} onDelete={onDelete} maxPerStatus={maxPerStatus} />;
  if (view === "timeline") return <Timeline items={items} onEdit={onEdit} onDelete={onDelete} />;
  return <List items={items} onEdit={onEdit} onDelete={onDelete} />;
}

function Kanban({ items, onEdit, onDelete, maxPerStatus }: Omit<Props, "view">) {
  return <div className="kanban-scroll"><div className="kanban-grid">{statuses.map((status) => {
    const tasks = items.filter((item) => item.status === status.value);
    const visibleTasks = maxPerStatus ? tasks.slice(0, maxPerStatus) : tasks;
    const Icon = status.icon;
    return <section className="kanban-column" key={status.value}>
      <header className="kanban-column-head"><Icon size={14} strokeWidth={2.4} style={{ color: status.color }} /><h2>{status.label}</h2><span className="count-pill">{tasks.length}</span></header>
      <div className="kanban-cards">{tasks.length ? visibleTasks.map((task) => <article className={`kanban-card kanban-priority-${task.priority}`} key={task.taskId}>
        <div className="kanban-card-priority"><Badge value={task.priority} kind="priority" /><Actions task={task} onEdit={onEdit} onDelete={onDelete} /></div>
        <div className="kanban-card-body">
          <Link href={`/tasks/${task.taskId}`} className="task-title-link">{task.title}</Link>
          <TaskTags task={task} />
          <footer className="kanban-card-foot"><span className="project-chip">{task.projectName}</span><span className="due-label"><CalendarDays size={13} />{formatDate(task.dueDate)}</span></footer>
        </div>
      </article>) : <div className="empty-column">No tasks in this status</div>}{maxPerStatus && tasks.length > maxPerStatus && <Link href="/admin/tasks" className="more-tasks-link">View {tasks.length - maxPerStatus} more</Link>}</div>
    </section>;
  })}</div></div>;
}

function Timeline({ items, onEdit, onDelete }: Omit<Props, "view">) {
  const starts = items.map((item) => new Date(item.createdDate).getTime()).filter(Number.isFinite);
  const ends = items.map((item) => item.dueDate ? new Date(`${item.dueDate}T23:59:59`).getTime() : new Date(item.createdDate).getTime()).filter(Number.isFinite);
  const min = Math.min(...starts);
  const max = Math.max(...ends, min + 42 * 86400000);
  const span = Math.max(max - min, 1);
  const ticks = Array.from({ length: 6 }, (_, index) => new Date(min + span * (index / 5)));
  return <div className="workspace-panel timeline-scroll"><div className="timeline-grid" style={{ minWidth: 920 }}>
    <div className="timeline-corner">Task · created to due date</div>
    <div className="timeline-head">{ticks.map((tick, index) => <span key={index}>{tick.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>)}</div>
    {items.map((task) => {
      const start = new Date(task.createdDate).getTime();
      const end = task.dueDate ? new Date(`${task.dueDate}T23:59:59`).getTime() : start;
      const left = Math.max(0, ((start - min) / span) * 100);
      const width = task.dueDate ? Math.max(4, Math.min(100 - left, ((end - start) / span) * 100)) : 0;
      const meta = statuses[task.status] || statuses[0];
      return <div className="contents" key={task.taskId}>
        <div className="timeline-task"><span className="status-dot" style={{ backgroundColor: meta.color }} /><div className="min-w-0 flex-1"><Link href={`/tasks/${task.taskId}`} className="truncate font-bold hover:text-[var(--brand)]">{task.title}</Link><p>{task.projectName}</p></div><Actions task={task} onEdit={onEdit} onDelete={onDelete} /></div>
        <div className="timeline-lane">{task.dueDate ? <div className="timeline-bar" title={`Created ${formatDate(task.createdDate.slice(0, 10))} · Due ${formatDate(task.dueDate)}`} style={{ left: `${left}%`, width: `${width}%`, backgroundColor: meta.color }}><span>{task.title}</span></div> : <div className="timeline-point" title={`Created ${formatDate(task.createdDate.slice(0, 10))} · No due date`} style={{ left: `${left}%`, backgroundColor: meta.color }}><span className="sr-only">{task.title}: no due date</span></div>}</div>
      </div>;
    })}
  </div></div>;
}

function List({ items, onEdit, onDelete }: Omit<Props, "view">) {
  const hasActions = Boolean(onEdit && onDelete);
  const [collapsed, setCollapsed] = useState<number[]>([]);
  const toggle = (status: number) => setCollapsed((current) => current.includes(status) ? current.filter((value) => value !== status) : [...current, status]);
  return <div className="list-groups">{statuses.map((status) => {
    const tasks = items.filter((item) => item.status === status.value);
    if (!tasks.length) return null;
    const isCollapsed = collapsed.includes(status.value);
    const StatusIcon = status.icon;
    return <section className="task-group" key={status.value}>
      <button className="task-group-head" style={{ backgroundColor: status.headerBackground, borderColor: status.headerBorder, boxShadow: `inset 4px 0 0 ${status.color}` }} aria-expanded={!isCollapsed} onClick={() => toggle(status.value)}>
        <ChevronDown className={isCollapsed ? "collapsed" : ""} size={15} />
        <StatusIcon size={14} style={{ color: status.color }} />
        <h2>{status.label}</h2><span className="count-pill">{tasks.length}</span>
      </button>
      {!isCollapsed && <div className="table-wrap"><table className="task-list-table">
        <thead><tr><th>Task name</th><th>Project</th><th>Created</th><th>Due date</th><th>Priority</th><th>Tags</th>{hasActions && <th aria-label="Actions" />}</tr></thead>
        <tbody>{tasks.map((task) => <tr key={task.taskId}>
          <td data-label="Task"><Link href={`/tasks/${task.taskId}`} className="task-title-link">{task.title}</Link></td>
          <td data-label="Project"><span className="project-chip">{task.projectName}</span></td>
          <td data-label="Created"><span className="date-cell">{formatDate(task.createdDate.slice(0, 10))}</span></td>
          <td data-label="Due date"><span className="due-label"><CalendarDays size={13} />{formatDate(task.dueDate)}</span></td>
          <td data-label="Priority"><Badge value={task.priority} kind="priority" /></td>
          <td data-label="Tags">{task.tags.length ? <TaskTags task={task} /> : <span className="empty-value">—</span>}</td>
          {hasActions && <td data-label="Actions"><Actions task={task} onEdit={onEdit} onDelete={onDelete} /></td>}
        </tr>)}</tbody>
      </table></div>}
    </section>;
  })}</div>;
}
