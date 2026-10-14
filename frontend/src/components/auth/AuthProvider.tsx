"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, tokenStore, tryRefresh } from "@/lib/api";
import type { TokenResponse, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loggedOut: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);

  // Sahifa yangilanganda: HttpOnly cookie'dagi refresh token orqali sessiyani tiklaymiz
  useEffect(() => {
    (async () => {
      if (await tryRefresh()) {
        try {
          setUser(await api.auth.me());
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
    const onExpired = () => {
      tokenStore.set(null);
      setUser(null);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const handleToken = useCallback((res: TokenResponse) => {
    tokenStore.set(res.accessToken);
    setLoggedOut(false);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      loggedOut,
      login: (email, password) => api.auth.login({ email, password }).then(handleToken),
      register: (fullName, email, password) => api.auth.register({ fullName, email, password }).then(handleToken),
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          tokenStore.set(null);
          setLoggedOut(true);
          setUser(null);
        }
      },
      setUser,
    }),
    [user, loading, loggedOut, handleToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

export const isStaff = (u: User | null) => !!u && (u.role === "ADMIN" || u.role === "TEACHER");
