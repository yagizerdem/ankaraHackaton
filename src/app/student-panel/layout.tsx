import AppLayout from "@/layouts/app-layout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppLayout>
      <div>{children}</div>
    </AppLayout>
  );
}
