"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserIcon } from "lucide-react";

import { navItems } from "@/app/student-panel/nav-items";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

/**
 * Panel navigation; the active item follows the current URL. Reading the URL
 * is request-time data, so the layout renders this inside <Suspense> with
 * PanelSidebarFallback.
 */
export function PanelSidebar() {
  return <SidebarBody pathname={usePathname()} />;
}

/** The same sidebar with no item highlighted, while the URL streams in. */
export function PanelSidebarFallback() {
  return <SidebarBody pathname={null} />;
}

function SidebarBody({ pathname }: { pathname: string | null }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 flex-col justify-between bg-surface-container-low py-4 lg:flex">
      <nav aria-label="Student panel" className="flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Nested pages (e.g. a single exam) keep their section highlighted.
          const active =
            pathname !== null &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
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

      <div className="px-4">
        {user ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-high p-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <UserIcon aria-hidden className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-md text-on-surface">
                {fullName || user.username}
              </span>
              <span className="truncate text-body-sm text-on-surface-variant">
                {user.email}
              </span>
            </div>
          </div>
        ) : (
          !isLoading && (
            <p className="rounded-lg bg-surface-container-high p-2 text-body-sm text-on-surface-variant">
              Sign in to see your own data.
            </p>
          )
        )}
      </div>
    </aside>
  );
}
