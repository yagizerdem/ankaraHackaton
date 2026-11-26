"use client";

import { useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

async function initParticles(engine: Engine) {
  await loadSlim(engine);
}

interface ParticleLayoutProps {
  children: React.ReactNode;
}

export function ParticleLayout({ children }: ParticleLayoutProps) {
  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: false,
      background: { color: "transparent" },
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      particles: {
        number: { value: 40, density: { enable: true } },
        shape: { type: "square" },
        paint: {
          fill: { enable: true, color: { value: "#262626" }, opacity: 0.12 },
          stroke: { width: 1.5, color: { value: "#262626" }, opacity: 0.6 },
        },
        size: { value: { min: 4, max: 14 } },
        opacity: {
          value: { min: 0.3, max: 0.8 },
          animation: { enable: true, speed: 0.4, sync: false },
        },
        rotate: {
          value: { min: 0, max: 360 },
          direction: "random",
          animation: { enable: true, speed: 4, sync: false },
        },
        move: {
          enable: true,
          speed: { min: 0.3, max: 1 },
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
      },
    }),
    [],
  );

  return (
    <div className="relative isolate flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 dark:invert"
      >
        <ParticlesProvider init={initParticles}>
          <Particles
            id="auth-particles"
            options={options}
            className="size-full"
          />
        </ParticlesProvider>
      </div>
      {children}
    </div>
  );
}
