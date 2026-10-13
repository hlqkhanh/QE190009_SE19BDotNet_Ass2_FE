"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { expireSession, readSession, SESSION_EVENT, SESSION_KEY, sessionExpired, withSessionLock, writeSession } from "@/lib/session";
import type { Account, Session } from "@/types";

type AuthState = { account: Account | null; loading: boolean; loggingOut: boolean; error: string; login: (session: Session) => void; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => { if (pathname === "/" && loggingOut) queueMicrotask(() => setLoggingOut(false)); }, [pathname, loggingOut]);
  const [state, setState] = useState<{ account: Account | null; loading: boolean; error: string }>({ account: null, loading: true, error: "" });
  useEffect(() => {
    let stopped = false;
    let generation = 0;
    let refreshBusy = false;
    const verify = async () => {
      const attempt = ++generation;
      const session = readSession();
      if (!session || sessionExpired(session)) {
        if (session) writeSession(null);
        if (!stopped && attempt === generation) setState({ account: null, loading: false, error: "" });
        return;
      }
      try {
        const account = await api<Account>("/api/auth/me");
        if (!stopped && attempt === generation && readSession()?.accessToken === session.accessToken) setState({ account, loading: false, error: "" });
      } catch (error) {
        if (!stopped && attempt === generation) setState({ account: null, loading: false, error: error instanceof ApiError && error.status === 401 ? "" : "Unable to verify your session. Check the API connection and reload." });
      }
    };
    const refresh = async () => {
      if (stopped || refreshBusy) return;
      const session = readSession();
      if (!session) return;
      if (sessionExpired(session)) { expireSession(); return; }
      if (!navigator.locks || Date.parse(session.expiresAt) - Date.now() > 300000) return;
      refreshBusy = true;
      try {
        await withSessionLock(async () => {
          const latest = readSession();
          if (!latest || latest.refreshToken !== session.refreshToken || sessionExpired(latest)) return;
          if (Date.parse(latest.refreshExpiresAt) <= Date.now()) { expireSession(); return; }
          try {
            const next = await api<Session>("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: latest.refreshToken }) });
            if (!stopped && readSession()?.refreshToken === latest.refreshToken) writeSession(next);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401 && readSession()?.refreshToken === latest.refreshToken) expireSession();
          }
        });
      } finally { refreshBusy = false; }
    };
    const changed = () => { void verify(); };
    const storageChanged = (event: StorageEvent) => { if (event.key === SESSION_KEY || event.key === null) void verify(); };
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener(SESSION_EVENT, changed);
    window.addEventListener("storage", storageChanged);
    document.addEventListener("visibilitychange", visible);
    void verify().then(refresh);
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    return () => { stopped = true; generation++; clearInterval(timer); window.removeEventListener(SESSION_EVENT, changed); window.removeEventListener("storage", storageChanged); document.removeEventListener("visibilitychange", visible); };
  }, []);
  const login = useCallback((session: Session) => {
    setLoggingOut(false);
    setState({ account: null, loading: true, error: "" });
    // The session event verifies /me. Login only navigates after that succeeds.
    writeSession(session);
  }, []);
  const logout = useCallback(async () => {
    setLoggingOut(true);
    await withSessionLock(async () => {
      const session = readSession();
      writeSession(null);
      if (session) {
        try { await api("/api/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: session.refreshToken }) }); }
        catch { /* The browser session is cleared even when the API is offline. */ }
      }
    });
    router.replace("/");
  }, [router]);
  return <AuthContext.Provider value={{ ...state, loggingOut, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
