"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDownIcon, EllipsisVerticalIcon, UserIcon } from "lucide-react";

import { activeCourse, navItems, student } from "@/app/student-panel/dashboard/mockdata";
import { cn } from "@/lib/utils";

/** Panel navigation; the active item follows the current URL. */
export function PanelSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const CourseIcon = activeCourse.icon;

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 flex-col justify-between bg-surface-container-low py-4 lg:flex">
      <nav aria-label="Student panel" className="flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Nested pages (e.g. a single exam) keep their section highlighted.
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => router.push(item.href)}
              // Start loading the page before the click lands.
              onPointerEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-left text-label-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active
                  ? "bg-primary-container font-bold text-on-primary-container shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-1 rounded-lg bg-surface-container p-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-sm uppercase">Active Course</span>
            <ChevronsUpDownIcon className="size-4" />
          </div>
          <div className="flex items-center gap-1">
            <CourseIcon className="size-4 shrink-0 text-primary" />
            <span className="truncate text-label-md text-on-surface">
              {activeCourse.code} - {activeCourse.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-surface-container-high p-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <UserIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-md text-on-surface">{student.fullName}</span>
            <span className="truncate text-body-sm text-on-surface-variant">{student.department}</span>
          </div>
          <button
            type="button"
            aria-label="Account options"
            className="rounded text-on-surface-variant hover:text-on-surface"
          >
            <EllipsisVerticalIcon className="size-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
