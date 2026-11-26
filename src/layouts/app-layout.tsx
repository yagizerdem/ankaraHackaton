"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, NetworkIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      <Link href="/profile" className={buttonVariants({ variant: "ghost" })}>
        <UserIcon />
        <span className="max-w-32 truncate">{user.username}</span>
      </Link>
      <Button variant="outline" onClick={signOut} disabled={signingOut}>
        <LogOutIcon />
        {signingOut ? "Signing out..." : "Sign out"}
      </Button>
    </>
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
