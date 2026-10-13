"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Building2, CheckSquare2, Folder, FolderKanban, LayoutDashboard, Menu, Search, Tags, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/types";
import { useAuth } from "@/components/auth-provider";

const browse = [
  { href: "/", label: "Overview", icon: LayoutDashboard, match: (path: string) => path === "/" },
  { href: "/departments", label: "Departments", icon: Building2, match: (path: string) => path === "/departments" || /^\/departments\/\d+$/.test(path) },
  { href: "/search", label: "Search tasks", icon: Search, match: (path: string) => path === "/search" },
];

const manage = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, match: (path: string) => path === "/admin" },
  { href: "/admin/tasks", label: "Task management", icon: CheckSquare2, match: (path: string) => path === "/admin/tasks" },
  { href: "/admin/projects", label: "Project management", icon: FolderKanban, match: (path: string) => path === "/admin/projects" },
  { href: "/admin/departments", label: "Department management", icon: Building2, match: (path: string) => path === "/admin/departments" },
  { href: "/admin/tags", label: "Tag management", icon: Tags, match: (path: string) => path === "/admin/tags" },
];

function NavLink({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className={`side-link ${active ? "active" : ""}`}><span className="side-icon"><Icon size={17} strokeWidth={2} /></span><span>{label}</span>{active && <span className="side-active-dot" />}</Link>;
}

function pageTitle(pathname: string) {
  if (pathname === "/") return "Overview";
  if (pathname === "/departments") return "Departments";
  if (/^\/departments\/\d+$/.test(pathname)) return "Department details";
  if (/^\/projects\/\d+$/.test(pathname)) return "Project details";
  if (/^\/tasks\/\d+$/.test(pathname)) return "Task details";
  if (pathname === "/search") return "Search tasks";
  if (pathname === "/login") return "Login";
  if (pathname === "/register") return "Register";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/admin/accounts") return "Accounts";
  const item = manage.find(({ href }) => href === pathname);
  return item ? `Manage ${item.label.toLowerCase()}` : "Task Management";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { account, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>();
  const close = () => setOpen(false);
  useEffect(() => {
    api<Project[]>("/api/projects").then(setProjects).catch(() => setProjects([]));
  }, []);
  return <div className="app-frame">
    {open && <button aria-label="Close navigation overlay" className="nav-overlay" onClick={close} />}
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-account">
        <span className="brand-mark"><CheckSquare2 size={20} /></span>
        <div><strong>Task Management</strong><small>PRN232 · Team workspace</small></div>
        <button aria-label="Close navigation" className="icon-btn sidebar-close ml-auto" onClick={close}><X size={19} /></button>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="side-label">Browse</p>
        <div className="side-list">{browse.map((item) => <NavLink key={item.href} {...item} active={item.match(pathname)} onClick={close} />)}</div>
        <div className="side-section-heading">
          <p className="side-label">Projects</p>
          {account && <Link href="/admin/projects" onClick={close}>Manage</Link>}
        </div>
        <div className="side-list project-side-list">
          {projects === undefined && <p className="side-list-message">Loading projects...</p>}
          {projects?.map((project) => <Link
            key={project.projectId}
            href={`/projects/${project.projectId}`}
            onClick={close}
            className={`side-link project-side-link ${pathname === `/projects/${project.projectId}` ? "active" : ""}`}
          >
            <span className="project-side-icon"><Folder size={15} /></span>
            <span title={project.projectName}>{project.projectName}</span>
            {pathname === `/projects/${project.projectId}` && <span className="side-active-dot" />}
          </Link>)}
          {projects?.length === 0 && <p className="side-list-message">No active projects</p>}
        </div>
        {account && <><p className="side-label side-label-spaced">Manage</p>
        <div className="side-list">{manage.map((item) => <NavLink key={item.href} {...item} active={item.match(pathname)} onClick={close} />)}{account.role === 1 && <NavLink href="/admin/accounts" label="Accounts" icon={CheckSquare2} active={pathname === "/admin/accounts"} onClick={close} />}</div></>}
      </nav>
      <div className="sidebar-context"><strong>{account ? account.fullName : "Public workspace"}</strong><p>{account ? `${account.role === 1 ? "Admin" : "Staff"} · Management access` : "Browse departments, projects and tasks. Log in to manage your workspace."}</p></div>
    </aside>

    <main className="app-main">
      <header className="topbar">
        <button aria-label="Open navigation" className="icon-btn menu-button" onClick={() => setOpen(true)}><Menu size={20} /></button>
        <div className="breadcrumbs"><Link href="/">Task Management</Link><b>/</b><strong>{pageTitle(pathname)}</strong></div>
        <Link href="/search" className="top-search"><Search size={16} /><span>Search tasks</span></Link>
        {!loading && <div className="flex flex-wrap items-center gap-2 ml-auto">{account ? <><Link href="/profile" className="btn btn-ghost" title={account.email}>{account.fullName}</Link><button className="btn btn-secondary" onClick={() => { void logout(); }}>Logout</button></> : <><Link href="/login" className="btn btn-secondary">Login</Link><Link href="/register" className="btn btn-primary">Register</Link></>}</div>}
      </header>
      <div className="app-content">{children}</div>
    </main>
  </div>;
}
