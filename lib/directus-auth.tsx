"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface DirectusUser {
  id: string;
  email: string;
  role: { id: string; name: string };
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires: number;
}

interface AuthContextValue {
  isLoading: boolean;
  isReviewer: boolean;
  user: DirectusUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
}

const STORAGE_KEY = "stage.directus.reviewer-session";
const AuthContext = createContext<AuthContextValue | null>(null);

function directusUrl(): string {
  const value = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_DIRECTUS_URL is not configured");
  }
  return value.replace(/\/$/, "");
}

async function responseData<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | { data?: T; errors?: Array<{ message?: string }> }
    | null;
  if (!response.ok) {
    throw new Error(
      body?.errors?.[0]?.message ??
        `${response.status} ${response.statusText}`.trim(),
    );
  }
  return body?.data as T;
}

function saveSession(session: StoredSession | null) {
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function toStoredSession(data: LoginResponse): StoredSession {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires,
  };
}

async function fetchUser(accessToken: string): Promise<DirectusUser> {
  const response = await fetch(
    `${directusUrl()}/users/me?fields=id,email,role.id,role.name`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const user = await responseData<DirectusUser>(response);
  if (user.role?.name?.trim().toLowerCase() !== "reviewer") {
    throw new Error("This account does not have the reviewer role");
  }
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<DirectusUser | null>(null);
  const sessionRef = useRef<StoredSession | null>(null);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    saveSession(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async (): Promise<StoredSession> => {
    const current = sessionRef.current;
    if (!current?.refreshToken) throw new Error("Reviewer session has expired");
    const response = await fetch(`${directusUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: current.refreshToken,
        mode: "json",
      }),
    });
    const next = toStoredSession(await responseData<LoginResponse>(response));
    sessionRef.current = next;
    saveSession(next);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        sessionRef.current = JSON.parse(raw) as StoredSession;
        const session =
          sessionRef.current.expiresAt <= Date.now() + 30_000
            ? await refresh()
            : sessionRef.current;
        const restoredUser = await fetchUser(session.accessToken);
        if (active) setUser(restoredUser);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, [clearSession, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${directusUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode: "json" }),
    });
    const session = toStoredSession(await responseData<LoginResponse>(response));
    try {
      const authenticatedUser = await fetchUser(session.accessToken);
      sessionRef.current = session;
      saveSession(session);
      setUser(authenticatedUser);
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    const refreshToken = sessionRef.current?.refreshToken;
    clearSession();
    if (!refreshToken) return;
    await fetch(`${directusUrl()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
    }).catch(() => undefined);
  }, [clearSession]);

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      let session = sessionRef.current;
      if (!session) throw new Error("Please log in as a reviewer");
      if (session.expiresAt <= Date.now() + 30_000) session = await refresh();

      const send = (accessToken: string) =>
        fetch(`${directusUrl()}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });

      let response = await send(session.accessToken);
      if (response.status === 401) {
        try {
          session = await refresh();
          response = await send(session.accessToken);
        } catch (error) {
          clearSession();
          throw error;
        }
      }
      return responseData<T>(response);
    },
    [clearSession, refresh],
  );

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isReviewer: user !== null,
        user,
        login,
        logout,
        request,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useReviewerAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useReviewerAuth must be used inside AuthProvider");
  return value;
}
