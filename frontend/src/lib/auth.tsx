"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Auth, setAccessToken, type TokenResponse, type UserResponse } from "./api";

type AuthState = {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Sahifa yangilanganda: cookie'dagi refresh token orqali sessiyani tiklaymiz
  useEffect(() => {
    (async () => {
      if (await Auth.refresh()) {
        try {
          setUser(await Auth.me());
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const apply = (t: TokenResponse) => {
    setAccessToken(t.accessToken);
    setUser(t.user);
  };

  const login = useCallback(async (email: string, password: string) => apply(await Auth.login(email, password)), []);
  const register = useCallback(
    async (email: string, password: string, fullName: string) => apply(await Auth.register(email, password, fullName)),
    [],
  );
  const logout = useCallback(async () => {
    try {
      await Auth.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
