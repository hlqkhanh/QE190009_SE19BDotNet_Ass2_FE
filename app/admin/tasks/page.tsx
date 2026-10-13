"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Filter, KanbanSquare, List, Plus, Search, SlidersHorizontal, Timeline } from "lucide-react";
import { api } from "@/lib/api";
import { ConfirmDialog, Loading, Modal, Toast } from "@/components/ui";
import { TaskViews, type TaskView } from "@/components/task-views";
import type { Project, Tag, TaskInput, TaskItem } from "@/types";

const blank: TaskInput = { title: "", description: "", status: 0, priority: 1, dueDate: null, projectId: 0, tagIds: [] };
const views: { value: TaskView; label: string; icon: typeof List }[] = [
  { value: "kanban", label: "Kanban", icon: KanbanSquare },
  { value: "timeline", label: "Timeline", icon: Timeline },
  { value: "list", label: "List", icon: List },
];

export default function TaskManagePage() {
  const [items, setItems] = useState<TaskItem[]>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editing, setEditing] = useState<TaskItem | null | undefined>();
  const [pendingDelete, setPendingDelete] = useState<TaskItem | null>(null);
  const [form, setForm] = useState(blank);
  const [view, setView] = useState<TaskView>("list");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", error: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => Promise.all([
    api<TaskItem[]>("/api/tasks"), api<Project[]>("/api/projects"), api<Tag[]>("/api/tags"),
  ]).then(([tasks, projectList, tagList]) => {
    setItems(tasks); setProjects(projectList); setTags(tagList);
  }).catch((error) => { setItems([]); setToast({ message: error.message, error: true }); }), []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => (items || []).filter((item) =>
    (!status || String(item.status) === status) &&
    (!priority || String(item.priority) === priority) &&
    (!projectId || String(item.projectId) === projectId) &&
    (!query || `${item.title} ${item.description} ${item.projectName} ${item.tags.map((tag) => tag.tagName).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
  ), [items, status, priority, projectId, query]);

  const activeFilters = [status, priority, projectId].filter(Boolean).length;
  const open = (item: TaskItem | null) => {
    setEditing(item);
    setForm(item ? {
      title: item.title, description: item.description || "", status: item.status, priority: item.priority,
      dueDate: item.dueDate, projectId: item.projectId, tagIds: item.tags.map((tag) => tag.tagId),
    } : { ...blank, projectId: projects[0]?.projectId || 0 });
  };
  const toggleTag = (id: number) => setForm((current) => ({
    ...current, tagIds: current.tagIds.includes(id) ? current.tagIds.filter((tagId) => tagId !== id) : [...current.tagIds, id],
  }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.projectId) return setToast({ message: "Title and project are required.", error: true });
    setSaving(true);
    try {
      await api(editing ? `/api/tasks/${editing.taskId}` : "/api/tasks", { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
      setEditing(undefined);
      setToast({ message: editing ? "Task updated." : "Task created.", error: false });
      await load();
    } catch (error) { setToast({ message: (error as Error).message, error: true }); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/api/tasks/${pendingDelete.taskId}`, { method: "DELETE" });
      setPendingDelete(null);
      setToast({ message: "Task archived successfully.", error: false });
      await load();
    } catch (error) { setToast({ message: (error as Error).message, error: true }); }
    finally { setDeleting(false); }
  };

  if (!items) return <Loading />;
  return (
    <div className="workspace-page">
      <header className="workspace-heading">
        <div className="project-mark">T</div>
        <div className="min-w-0 flex-1">
          <p className="workspace-kicker">Task management</p>
          <div className="flex flex-wrap items-center gap-3"><h1>Tasks</h1><span className="public-pill">Protected management</span></div>
          <p>Create, update, filter, and archive tasks. Timeline bars run from created date to due date.</p>
        </div>
      </header>

      <div className="view-bar">
        <div className="view-tabs" role="tablist" aria-label="Task view">
          {views.map(({ value, label, icon: Icon }) => <button key={value} role="tab" aria-selected={view === value} className={view === value ? "active" : ""} onClick={() => setView(value)}><Icon size={16} />{label}</button>)}
        </div>
        <div className="view-actions">
          <div className="search-box"><Search size={16} /><input aria-label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." /></div>
          <button className={`btn btn-secondary ${activeFilters ? "filter-active" : ""}`} onClick={() => setFiltersOpen((value) => !value)}><Filter size={16} />Filter{activeFilters > 0 && <span>{activeFilters}</span>}</button>
          <button className="btn btn-primary" onClick={() => open(null)}><Plus size={16} />New task</button>
        </div>
      </div>

      {filtersOpen && <div className="filter-panel">
        <div className="filter-panel-title"><SlidersHorizontal size={16} /><span>Filter tasks</span></div>
        <label>Status<select className="field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="0">To do</option><option value="1">In progress</option><option value="2">Done</option><option value="3">Cancelled</option></select></label>
        <label>Priority<select className="field" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="">All priorities</option><option value="0">Low</option><option value="1">Medium</option><option value="2">High</option><option value="3">Critical</option></select></label>
        <label>Project<select className="field" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">All projects</option>{projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.projectName}</option>)}</select></label>
        <button className="btn btn-ghost" onClick={() => { setStatus(""); setPriority(""); setProjectId(""); }}>Clear filters</button>
      </div>}

      <div className="result-summary"><span>{visible.length} tasks</span><span>·</span><span>{projects.length} active projects</span></div>
      <TaskViews items={visible} view={view} onEdit={open} onDelete={setPendingDelete} />

      {editing !== undefined && <Modal title={editing ? "Edit task" : "Create a new task"} description="Add the details your team needs to move this work forward." onClose={() => setEditing(undefined)}>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <label className="label md:col-span-2">Task title<input autoFocus className="field" required maxLength={300} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be done?" /><span className="help-text text-right">{form.title.length}/300</span></label>
          <label className="label md:col-span-2">Description <span className="help-text">Optional</span><textarea className="field min-h-24 resize-y" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add context, requirements, or an expected outcome." /></label>
          <label className="label md:col-span-2">Project<select required className="field" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: Number(event.target.value) })}><option value={0}>Select project...</option>{projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.projectName}</option>)}</select></label>
          <label className="label">Status<select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}><option value={0}>To do</option><option value={1}>In progress</option><option value={2}>Done</option><option value={3}>Cancelled</option></select></label>
          <label className="label">Priority<select className="field" value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}><option value={0}>Low</option><option value={1}>Medium</option><option value={2}>High</option><option value={3}>Critical</option></select></label>
          <label className="label md:col-span-2">Due date <span className="help-text">Optional</span><input type="date" className="field" value={form.dueDate || ""} onChange={(event) => setForm({ ...form, dueDate: event.target.value || null })} /></label>
          <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-bold text-[var(--text-soft)]">Tags <span className="help-text">Select any that apply</span></legend><div className="tag-picker">{tags.map((tag) => <label key={tag.tagId} className={form.tagIds.includes(tag.tagId) ? "selected" : ""}><input type="checkbox" checked={form.tagIds.includes(tag.tagId)} onChange={() => toggleTag(tag.tagId)} /><span style={{ backgroundColor: tag.color || "#697386" }} />{tag.tagName}</label>)}</div></fieldset>
          <div className="modal-actions md:col-span-2"><button type="button" className="btn btn-secondary" onClick={() => setEditing(undefined)}>Cancel</button><button disabled={saving} className="btn btn-primary">{saving ? "Saving..." : "Save task"}</button></div>
        </form>
      </Modal>}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Archive task?" description={`“${pendingDelete?.title}” will be hidden from active views. The record remains in the database.`} confirmLabel="Archive task" busy={deleting} onCancel={() => setPendingDelete(null)} onConfirm={remove} />
      <Toast {...toast} />
    </div>
  );
}
