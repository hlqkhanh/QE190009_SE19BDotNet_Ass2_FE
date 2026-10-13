const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public errors: Record<string, string[]> = {}, public status = 0) { super(message); }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();
  const protectedRequest = path.startsWith("/api/accounts") || ["/api/auth/me", "/api/auth/profile", "/api/auth/password"].includes(path) || (!path.startsWith("/api/auth/") && !["GET", "HEAD"].includes(method));
  const session = protectedRequest ? readSession() : null;
  if (protectedRequest && (!session || sessionExpired(session))) {
    if (typeof window !== "undefined") expireSession();
    throw new ApiError("Please log in again.", {}, 401);
  }
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const errors = body.errors || {};
    const message = Object.values(errors).flat().join(" ") || body.detail || body.title || "Request failed.";
    if (response.status === 401 && protectedRequest && readSession()?.accessToken === session?.accessToken) expireSession();
    throw new ApiError(message, errors, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)) : "No date";
import { expireSession, readSession, sessionExpired } from "@/lib/session";
