import { BaseProvider } from "@/providers/base-provider";
import { ThemeProvider } from "@/providers/theme-provider";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <BaseProvider>{children}</BaseProvider>
    </ThemeProvider>
  );
}
