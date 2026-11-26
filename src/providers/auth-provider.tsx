"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser, MeResponse } from "@/domain/auth";
import type { ApiResponse } from "@/lib/api-response";

type AuthProviderProps = {
  children: React.ReactNode;
};

type AuthProviderState = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
};

const initialState: AuthProviderState = {
  user: null,
  isLoading: true,
  setUser: () => null,
};

const AuthProviderContext = createContext<AuthProviderState>(initialState);

export function AuthProvider({ children, ...props }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ignore a response that lands after unmount (or a Strict Mode re-run).
    let ignore = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        // 401 just means nobody is signed in.
        if (!response.ok) {
          if (!ignore) setUser(null);
          return;
        }

        const body: ApiResponse<MeResponse> = await response.json();
        if (!ignore) setUser(body.data?.user ?? null);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  const value = {
    user,
    isLoading,
    setUser,
  };

  return (
    <AuthProviderContext.Provider {...props} value={value}>
      {children}
    </AuthProviderContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthProviderContext);

  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");

  return context;
};
