"use client";

import { createContext, useContext } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./auth-provider";

type BaseProviderProps = {
  children: React.ReactNode;
};

type BaseProviderState = {};

const initialState: BaseProviderState = {};

const BaseProviderContext = createContext<BaseProviderState>(initialState);

export function BaseProvider({ children, ...props }: BaseProviderProps) {
  const value = {};

  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <BaseProviderContext.Provider {...props} value={value}>
            {children}
          </BaseProviderContext.Provider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export const useBase = () => {
  const context = useContext(BaseProviderContext);

  if (context === undefined)
    throw new Error("useBase must be used within a BaseProvider");

  return context;
};
