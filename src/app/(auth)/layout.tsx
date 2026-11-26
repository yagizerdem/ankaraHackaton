import { ParticleLayout } from "./components/particle-layout";
import { ThemeToggle } from "./components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ParticleLayout>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>
    </ParticleLayout>
  );
}
