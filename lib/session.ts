import type { Account, Session } from "@/types";

export const SESSION_KEY = "tasktrack.ass2.session";
export const SESSION_EVENT = "tasktrack-session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Session | null;
    if (!value || typeof value.accessToken !== "string" || typeof value.refreshToken !== "string" || !value.account || !Number.isFinite(Date.parse(value.expiresAt)) || !Number.isFinite(Date.parse(value.refreshExpiresAt))) return null;
    return value;
  } catch { return null; }
}

export function sessionExpired(session: Session): boolean {
  try {
    const part = session.accessToken.split(".")[1];
    const claim = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof claim.exp !== "number" || claim.exp * 1000 <= Date.now() || Date.parse(session.expiresAt) <= Date.now();
  } catch { return true; }
}

export function writeSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function expireSession() {
  writeSession(null);
  if (window.location.pathname !== "/login") window.location.replace("/login");
}

export function updateSessionAccount(account: Account) {
  const session = readSession();
  if (session) writeSession({ ...session, account });
}

export async function withSessionLock<T>(action: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request("tasktrack-ass2-refresh", action);
  // No automatic rotation without a cross-tab lock; expiry still redirects safely.
  return action();
}
