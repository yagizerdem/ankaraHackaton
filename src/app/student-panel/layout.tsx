import { Suspense } from "react";
import { Inter } from "next/font/google";

import {
  PanelSidebar,
  PanelSidebarFallback,
} from "@/app/student-panel/components/panel-sidebar";
import AppLayout from "@/layouts/app-layout";
import { cn } from "@/lib/utils";

// The Stitch design system (DESIGN-*.md) sets every tier in Inter.
const inter = Inter({ subsets: ["latin", "latin-ext"] });

interface StudentPanelLayoutProps {
  children: React.ReactNode;
}

export default function StudentPanelLayout({ children }: StudentPanelLayoutProps) {
  return (
    <AppLayout>
      <div className={cn(inter.className, "flex flex-1 bg-surface text-on-surface antialiased")}>
        {/* The active item comes from the URL, which streams in at request time. */}
        <Suspense fallback={<PanelSidebarFallback />}>
          <PanelSidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AppLayout>
  );
}
