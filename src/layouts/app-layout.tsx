"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ChevronDownIcon,
  LogOutIcon,
  MailIcon,
  NetworkIcon,
  UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/domain/auth";
import { useAuth } from "@/providers/auth-provider";
import { ThemeSwitch } from "@/components/theme-switch";

const APP_NAME = "Ankara Hackaton";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <AppFooter />
    </div>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NetworkIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeSwitch />
          <AuthActions />
        </nav>
      </div>
    </header>
  );
}

function AuthActions() {
  const { user, isLoading, setUser } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) throw new Error();

      setUser(null);
      toast.success("Signed out");
      router.push("/");
    } catch {
      toast.error("Could not sign out, please try again");
    } finally {
      setSigningOut(false);
    }
  }

  // Same footprint as the buttons, so the header doesn't jump once /me answers.
  if (isLoading) {
    return (
      <>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Link href="/signin" className={buttonVariants({ variant: "ghost" })}>
          Sign in
        </Link>
        <Link href="/signup" className={buttonVariants()}>
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <ProfileMenu user={user} />
      <Button variant="outline" onClick={signOut} disabled={signingOut}>
        <LogOutIcon />
        {signingOut ? "Signing out..." : "Sign out"}
      </Button>
    </>
  );
}

function ProfileMenu({ user }: { user: AuthUser }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="group" />}
      >
        <UserIcon />
        <span className="max-w-32 truncate">{user.username}</span>
        <ChevronDownIcon className="transition-transform duration-200 group-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground uppercase">
            {(user.firstName?.[0] ?? user.username[0]) +
              (user.lastName?.[0] ?? "")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {fullName || user.username}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <dl className="flex flex-col gap-2 px-2 py-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MailIcon className="size-4 shrink-0" />
            <dt className="sr-only">Email</dt>
            <dd className="truncate text-foreground">{user.email}</dd>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="size-4 shrink-0" />
            <dt className="sr-only">Member since</dt>
            <dd>Member since {format(new Date(user.createdAt), "PP")}</dd>
          </div>
        </dl>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>{APP_NAME}</p>
        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/signin" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
