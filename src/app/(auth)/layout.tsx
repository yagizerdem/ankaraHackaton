import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ParticleLayout } from "./components/particle-layout";
import { ThemeToggle } from "./components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ParticleLayout>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              <ArrowLeftIcon />
              Back
            </Link>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>
    </ParticleLayout>
  );
}
