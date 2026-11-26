"use client";

import { useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";

gsap.registerPlugin(useGSAP);

// Track width (w-14 = 56px) - knob (size-6 = 24px) - 2 * inset (4px).
const KNOB_TRAVEL = 24;

// The provider resolves "system" by toggling .dark on <html>, so that class is
// the source of truth for what is on screen.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
const getIsDark = () => document.documentElement.classList.contains("dark");
const getServerIsDark = () => false;

/** Sun/moon pill switch; GSAP slides the knob and swaps the icons. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const isDark = useSyncExternalStore(subscribe, getIsDark, getServerIsDark);

  const scope = useRef<HTMLButtonElement>(null);
  const hasAnimated = useRef(false);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const [incoming, outgoing] = isDark
        ? [".theme-moon", ".theme-sun"]
        : [".theme-sun", ".theme-moon"];

      // First paint (and reduced motion): jump to the final state, no tween.
      if (!hasAnimated.current || reduceMotion) {
        hasAnimated.current = true;
        gsap.set(".theme-knob", { x: isDark ? KNOB_TRAVEL : 0, scaleX: 1 });
        gsap.set(incoming, { autoAlpha: 1, rotate: 0, scale: 1 });
        gsap.set(outgoing, { autoAlpha: 0, rotate: -90, scale: 0.4 });
        return;
      }

      gsap
        .timeline({ defaults: { overwrite: "auto" } })
        // Knob stretches as it leaves, then settles with a small overshoot.
        .to(".theme-knob", { scaleX: 1.25, duration: 0.12, ease: "power2.in" })
        .to(
          ".theme-knob",
          {
            x: isDark ? KNOB_TRAVEL : 0,
            scaleX: 1,
            duration: 0.5,
            ease: "back.out(1.8)",
          },
          "<0.05",
        )
        .to(
          outgoing,
          {
            autoAlpha: 0,
            rotate: isDark ? -90 : 90,
            scale: 0.4,
            duration: 0.25,
            ease: "power2.in",
          },
          0,
        )
        .fromTo(
          incoming,
          { autoAlpha: 0, rotate: isDark ? 90 : -90, scale: 0.4 },
          {
            autoAlpha: 1,
            rotate: 0,
            scale: 1,
            duration: 0.45,
            ease: "back.out(2)",
          },
          0.15,
        )
        .fromTo(
          ".theme-track-glow",
          { autoAlpha: 0.6, scale: 0.6 },
          { autoAlpha: 0, scale: 1.4, duration: 0.6, ease: "power1.out" },
          0.2,
        );
    },
    { dependencies: [isDark], scope },
  );

  return (
    <button
      ref={scope}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border bg-muted p-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span
        aria-hidden
        className="theme-track-glow pointer-events-none absolute inset-0 rounded-full bg-primary/30 opacity-0"
      />
      <span
        aria-hidden
        className="theme-knob relative flex size-6 items-center justify-center rounded-full bg-background shadow-sm"
      >
        <SunIcon className="theme-sun absolute size-3.5 text-amber-500" />
        <MoonIcon className="theme-moon invisible absolute size-3.5 text-sky-400" />
      </span>
    </button>
  );
}
