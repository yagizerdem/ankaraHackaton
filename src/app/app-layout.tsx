import { BaseProvider } from "@/providers/base-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <BaseProvider>
        {children}
        <Toaster duration={5000} position="top-right" />
      </BaseProvider>
    </ThemeProvider>
  );
}
