"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import Cookies from "js-cookie";
import { LOGIN_MUTATION, ME_QUERY } from "./graphql/auth";

interface MeData {
  me: { id: string; username: string; email: string; role: string } | null;
}

interface AuthContextType {
  user: string | null;
  role: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loginMutation] = useMutation<{ tokenAuth: { token: string; refreshToken: string } }>(LOGIN_MUTATION);

  const { data: meData, loading: meLoading } = useQuery<MeData>(ME_QUERY, {
    skip: !token,
  });

  useEffect(() => {
    const savedToken = Cookies.get("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me.username);
      setRole(meData.me.role);
    }
  }, [meData]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const { data } = await loginMutation({
          variables: { username, password },
        });
        const newToken = data!.tokenAuth.token;
        const refreshToken = data!.tokenAuth.refreshToken;
        Cookies.set("token", newToken, { expires: 7 });
        Cookies.set("refreshToken", refreshToken, { expires: 7 });
        setToken(newToken);
        setUser(username);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Login failed";
        return { success: false, error: message };
      }
    },
    [loginMutation]
  );

  const logout = useCallback(() => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const hasRole = useCallback(
    (roles: string[]) => {
      return role !== null && roles.includes(role);
    },
    [role]
  );

  const value = useMemo(
    () => ({ user, role, token, login, logout, loading: meLoading, hasRole }),
    [user, role, token, login, logout, meLoading, hasRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
