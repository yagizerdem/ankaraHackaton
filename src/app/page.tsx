"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import AppLayout from "@/layouts/app-layout";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
});

// Mastery colors carry meaning across the whole page: graph, legend, diagram.
const COLOR = {
  mastered: "#2f9e7a",
  shaky: "#e2a93b",
  gap: "#e5484d",
  route: "#5b5bd6",
} as const;

type Status = "untested" | "mastered" | "shaky" | "gap";

const TOPICS = [
  { id: "basics", label: "Algebra basics", layer: 0 },
  { id: "functions", label: "Functions", layer: 1 },
  { id: "trig", label: "Trigonometry", layer: 1 },
  { id: "limit", label: "Limits", layer: 2 },
  { id: "continuity", label: "Continuity", layer: 3 },
  { id: "trigLimit", label: "Trig limits", layer: 3 },
  { id: "derivative", label: "Derivatives", layer: 3 },
  { id: "rules", label: "Derivative rules", layer: 4 },
  { id: "chain", label: "Chain rule", layer: 5 },
  { id: "optimization", label: "Optimization", layer: 5 },
  { id: "integral", label: "Integrals", layer: 6 },
] as const;

type TopicId = (typeof TOPICS)[number]["id"];

/** source is a prerequisite of target. */
const PREREQS: [TopicId, TopicId][] = [
  ["basics", "functions"],
  ["basics", "trig"],
  ["functions", "limit"],
  ["trig", "trigLimit"],
  ["limit", "trigLimit"],
  ["limit", "continuity"],
  ["limit", "derivative"],
  ["continuity", "derivative"],
  ["derivative", "rules"],
  ["rules", "chain"],
  ["rules", "optimization"],
  ["chain", "integral"],
  ["derivative", "integral"],
];

const ROUTE: [TopicId, TopicId][] = [["limit", "derivative"]];

interface DiagnosisStep {
  at: number;
  caption: string;
  set?: Partial<Record<TopicId, Status>>;
  /** Animated check travelling from a topic back to its prerequisite. */
  check?: [from: TopicId, to: TopicId];
  showRoute?: boolean;
}

// One diagnosis, replayed on a loop: a wrong answer, then a walk backwards
// through prerequisites until the real gap shows up.
const DIAGNOSIS: DiagnosisStep[] = [
  { at: 0, caption: "Answer a few questions and the map fills in." },
  {
    at: 1.4,
    caption: "A question on derivatives was answered incorrectly.",
    set: { derivative: "gap" },
  },
  {
    at: 3.4,
    caption: "Checking the prerequisite: limits.",
    check: ["derivative", "limit"],
    set: { limit: "shaky" },
  },
  {
    at: 5.4,
    caption: "Limits look shaky. Checking one step further back.",
    check: ["limit", "functions"],
    set: { functions: "mastered", basics: "mastered", trig: "mastered" },
  },
  {
    at: 7.4,
    caption: "Study next: limits, then derivatives.",
    showRoute: true,
  },
];
const LOOP_SECONDS = 14;
const CHECK_SECONDS = 1.2;

function stepIndexAt(t: number) {
  let index = 0;
  DIAGNOSIS.forEach((step, i) => {
    if (step.at <= t) index = i;
  });
  return index;
}

function statusesAt(t: number) {
  const statuses = new Map<TopicId, Status>();
  for (const step of DIAGNOSIS) {
    if (step.at > t) break;
    for (const [id, status] of Object.entries(step.set ?? {})) {
      statuses.set(id as TopicId, status);
    }
  }
  return statuses;
}

// Layered DAG in 3D: prerequisites sit higher, each layer is a ring.
const POSITIONS = (() => {
  const byLayer = new Map<number, TopicId[]>();
  for (const topic of TOPICS) {
    byLayer.set(topic.layer, [...(byLayer.get(topic.layer) ?? []), topic.id]);
  }
  const positions = new Map<TopicId, { x: number; y: number; z: number }>();
  for (const [layer, ids] of byLayer) {
    const radius = ids.length === 1 ? 70 : ids.length === 2 ? 170 : 200;
    ids.forEach((id, i) => {
      const angle = (i / ids.length) * Math.PI * 2 + layer * 1.1;
      positions.set(id, {
        x: Math.cos(angle) * radius,
        y: (3 - layer) * 50,
        z: Math.sin(angle) * radius,
      });
    });
  }
  return positions;
})();

function KnowledgeGraph3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let ink = "#000";
    let fontFamily = "sans-serif";
    // Chosen so Derivatives swings to the front while the diagnosis plays.
    let angle = 2.2;
    let velocity = 0;
    let time = reduceMotion ? DIAGNOSIS[DIAGNOSIS.length - 1].at + 1 : 0;
    let lastFrame = performance.now();
    let frame = 0;
    let visible = true;
    let dragging = false;
    let lastPointerX = 0;
    let shownStep = -1;
    const AUTO_SPEED = reduceMotion ? 0 : 0.14;
    const TILT = 0.42;
    const CAMERA = 620;

    function readTheme() {
      const style = getComputedStyle(canvas!);
      ink = style.color;
      fontFamily = style.fontFamily;
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(id: TopicId) {
      const p = POSITIONS.get(id)!;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = p.x * cos + p.z * sin;
      const z = -p.x * sin + p.z * cos;
      const y = p.y * Math.cos(TILT) - z * Math.sin(TILT);
      const depth = p.y * Math.sin(TILT) + z * Math.cos(TILT);
      // Leave room on the right for labels, which extend past their node.
      const scale = Math.min((width - 90) / 520, height / 380);
      const perspective = CAMERA / (CAMERA + depth);
      return {
        x: width / 2 - 45 + x * perspective * scale,
        y: height / 2 - y * perspective * scale,
        depth,
        // 0 = far back, 1 = closest to the viewer.
        near: Math.min(1, Math.max(0, (perspective - 0.78) / 0.45)),
        size: perspective * scale,
      };
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const t = time % LOOP_SECONDS;
      // Fade the diagnosis out before the loop restarts.
      const fade = Math.min(1, Math.max(0, (LOOP_SECONDS - 0.8 - t) / 0.8));
      const statuses = statusesAt(t);
      const showRoute = DIAGNOSIS.some((s) => s.showRoute && s.at <= t);

      const points = new Map(
        TOPICS.map((topic) => [topic.id, project(topic.id)]),
      );

      // Edges, far ones first.
      const edges = [...PREREQS].sort(
        ([a1, b1], [a2, b2]) =>
          points.get(a2)!.depth +
          points.get(b2)!.depth -
          points.get(a1)!.depth -
          points.get(b1)!.depth,
      );
      for (const [source, target] of edges) {
        const a = points.get(source)!;
        const b = points.get(target)!;
        const near = (a.near + b.near) / 2;
        const onRoute =
          showRoute && ROUTE.some(([s, d]) => s === source && d === target);

        ctx!.strokeStyle = onRoute ? COLOR.route : ink;
        ctx!.globalAlpha = onRoute ? fade : 0.12 + near * 0.3;
        ctx!.lineWidth = onRoute ? 3 * b.size : 1.2 * b.size;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();

        // Arrowhead just outside the target node, pointing at it.
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const tipX = b.x - ux * 11 * b.size;
        const tipY = b.y - uy * 11 * b.size;
        const head = 6 * b.size;
        ctx!.fillStyle = ctx!.strokeStyle;
        ctx!.beginPath();
        ctx!.moveTo(tipX, tipY);
        ctx!.lineTo(
          tipX - ux * head - uy * head * 0.6,
          tipY - uy * head + ux * head * 0.6,
        );
        ctx!.lineTo(
          tipX - ux * head + uy * head * 0.6,
          tipY - uy * head - ux * head * 0.6,
        );
        ctx!.closePath();
        ctx!.fill();
      }

      // The check travelling back to a prerequisite, just before it lands.
      const nextCheck = DIAGNOSIS.find((s) => s.check && s.at > t);
      if (nextCheck?.check && nextCheck.at - t <= CHECK_SECONDS) {
        const progress = 1 - (nextCheck.at - t) / CHECK_SECONDS;
        const a = points.get(nextCheck.check[0])!;
        const b = points.get(nextCheck.check[1])!;
        const x = a.x + (b.x - a.x) * progress;
        const y = a.y + (b.y - a.y) * progress;
        ctx!.fillStyle = COLOR.route;
        ctx!.globalAlpha = 0.25 * fade;
        ctx!.beginPath();
        ctx!.arc(x, y, 11 * a.size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = fade;
        ctx!.beginPath();
        ctx!.arc(x, y, 5 * a.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Nodes and labels, far ones first so near ones overlap them.
      const ordered = [...TOPICS].sort(
        (a, b) => points.get(b.id)!.depth - points.get(a.id)!.depth,
      );
      for (const topic of ordered) {
        const p = points.get(topic.id)!;
        const status = statuses.get(topic.id) ?? "untested";
        const radius = 8 * p.size;
        const color = status === "untested" ? null : COLOR[status];

        if (status === "gap") {
          const pulse = (time * 1.4) % 1;
          ctx!.globalAlpha = (1 - pulse) * 0.5 * fade;
          ctx!.strokeStyle = COLOR.gap;
          ctx!.lineWidth = 2 * p.size;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, radius * (1.3 + pulse * 1.6), 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Punch out the edges underneath so nodes read as solid.
        ctx!.globalCompositeOperation = "destination-out";
        ctx!.globalAlpha = 1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius + 2 * p.size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalCompositeOperation = "source-over";

        ctx!.globalAlpha = 0.35 + p.near * 0.65;
        ctx!.lineWidth = 1.5 * p.size;
        ctx!.strokeStyle = ink;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx!.stroke();
        if (color) {
          ctx!.globalAlpha = (0.45 + p.near * 0.55) * fade;
          ctx!.fillStyle = color;
          ctx!.fill();
        }

        ctx!.globalAlpha = 0.3 + p.near * 0.7;
        ctx!.fillStyle = ink;
        ctx!.font = `500 ${Math.round(13 * p.size)}px ${fontFamily}`;
        ctx!.textBaseline = "middle";
        ctx!.fillText(topic.label, p.x + radius + 7 * p.size, p.y);
      }
      ctx!.globalAlpha = 1;

      const index = stepIndexAt(t);
      if (index !== shownStep) {
        shownStep = index;
        setStepIndex(index);
      }
    }

    function tick(now: number) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if (!dragging) {
        // Ease a flick back to the idle spin.
        velocity += (AUTO_SPEED - velocity) * Math.min(1, dt * 2);
        angle += velocity * dt;
      }
      if (!reduceMotion) time += dt;

      draw();
      frame = visible ? requestAnimationFrame(tick) : 0;
    }

    function start() {
      if (frame) return;
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function onPointerDown(event: PointerEvent) {
      dragging = true;
      lastPointerX = event.clientX;
      canvas!.setPointerCapture(event.pointerId);
    }
    function onPointerMove(event: PointerEvent) {
      if (!dragging) return;
      const dx = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      angle += dx * 0.01;
      velocity = dx * 0.6;
      if (reduceMotion) draw();
    }
    function onPointerUp() {
      dragging = false;
    }

    readTheme();
    resize();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);

    // The theme switch toggles the `dark` class on <html>.
    const themeObserver = new MutationObserver(() => {
      readTheme();
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Stop drawing while the hero is scrolled out of view.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduceMotion) start();
    });
    visibilityObserver.observe(canvas);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    if (!reduceMotion) start();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <figure className="flex min-w-0 flex-col gap-4">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A map of calculus topics and their prerequisites. A wrong answer on derivatives is traced back to a gap in limits."
        className="h-[340px] w-full cursor-grab touch-pan-y text-foreground active:cursor-grabbing sm:h-[440px] lg:h-[480px]"
      />
      <figcaption className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-hidden className="min-h-5 text-sm text-foreground">
          {DIAGNOSIS[stepIndex].caption}
        </p>
        <MasteryLegend />
      </figcaption>
    </figure>
  );
}

function MasteryLegend() {
  const items = [
    { label: "Solid", color: COLOR.mastered },
    { label: "Shaky", color: COLOR.shaky },
    { label: "Gap", color: COLOR.gap },
    { label: "Not tested", color: null },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full border border-foreground/40"
            style={
              item.color
                ? { background: item.color, borderColor: item.color }
                : undefined
            }
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function PrerequisiteChain() {
  const links = [
    { topic: "Functions", note: "Solid", color: COLOR.mastered },
    { topic: "Limits", note: "The real gap", color: COLOR.gap },
    {
      topic: "Derivatives",
      note: "Where the answer went wrong",
      color: COLOR.shaky,
    },
  ];
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {links.map((link, i) => (
        <li key={link.topic} className="flex flex-1 gap-3 sm:flex-col sm:gap-4">
          <div className="flex flex-col items-center sm:flex-row">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ background: link.color }}
            />
            {i < links.length - 1 && (
              <span className="h-10 w-px bg-foreground/25 sm:h-px sm:w-full" />
            )}
          </div>
          <div className="pb-6 sm:pr-6 sm:pb-0">
            <p className="font-medium">{link.topic}</p>
            <p className="text-sm text-muted-foreground">{link.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const STEPS = [
  {
    title: "Upload your course PDF",
    body: "Lecture notes, a textbook chapter or slides. Twenty to fifty pages works best.",
  },
  {
    title: "See the topic map",
    body: "Topics become nodes. An arrow means one topic is needed before the next.",
  },
  {
    title: "Take a short diagnostic",
    body: "Questions adapt to your answers. A miss leads to its prerequisites, not just more of the same.",
  },
  {
    title: "Find the real gaps",
    body: "Each topic is marked solid, shaky or missing, along with how much evidence backs it.",
  },
  {
    title: "Follow your study path",
    body: "Study in prerequisite order, with the source pages for every topic. The path updates as you improve.",
  },
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const signedOut = !isLoading && !user;

  return (
    <AppLayout>
      <div className="font-(family-name:--font-geist-sans)">
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 pt-12 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-8 lg:pt-20">
          <div className="flex flex-col gap-6">
            <h1
              className={cn(
                display.className,
                "text-5xl leading-[0.95] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4rem]",
              )}
            >
              Don&apos;t just learn more. Learn what you&apos;re missing.
            </h1>
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              Upload a course PDF. LearnGraph maps its topics and how they
              depend on each other, checks what you already know, and tells you
              what to study next, in the right order.
            </p>
            <div className="flex min-h-10 flex-wrap items-center gap-3">
              {signedOut && (
                <>
                  <Link
                    href="/signup"
                    className={buttonVariants({ size: "lg" })}
                  >
                    Create an account
                  </Link>
                  <Link
                    href="/signin"
                    className={buttonVariants({
                      size: "lg",
                      variant: "outline",
                    })}
                  >
                    Sign in
                  </Link>
                </>
              )}
              {user && (
                <p className="text-muted-foreground">
                  Welcome back, {user.firstName || user.username}.
                </p>
              )}
            </div>
          </div>

          <KnowledgeGraph3D />
        </section>

        <section className="border-t">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-4">
              <h2
                className={cn(
                  display.className,
                  "text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-4xl",
                )}
              >
                A wrong answer shows where it hurts, not why.
              </h2>
              <p className="max-w-[60ch] leading-relaxed text-muted-foreground">
                Miss a derivative question and a regular quiz hands you more
                derivative questions. But the problem may sit earlier, in limits
                or functions. LearnGraph follows the prerequisites back until it
                finds the topic that is actually missing.
              </p>
            </div>
            <div className="flex items-center">
              <PrerequisiteChain />
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20">
            <h2
              className={cn(
                display.className,
                "max-w-[20ch] text-3xl leading-tight font-bold tracking-[-0.02em] sm:text-4xl",
              )}
            >
              From a PDF to a study plan
            </h2>
            <ol className="grid gap-8 md:grid-cols-5 md:gap-6">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="relative flex gap-4 md:flex-col"
                >
                  <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium tabular-nums">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-9 left-[17.5px] h-[calc(100%-1.5rem)] w-px bg-border md:top-[17.5px] md:left-9 md:h-px md:w-[calc(100%-0.75rem)]"
                    />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16">
            <h2
              className={cn(
                display.className,
                "text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-4xl",
              )}
            >
              For teachers: see what the whole class is missing.
            </h2>
            <ul className="flex flex-col gap-5">
              {[
                "Review the generated topic map and fix any wrong links before students see it.",
                "See which topics most students are missing, and which ones still need more answers to judge.",
                "Know what to reteach first, ordered by the prerequisites behind it.",
              ].map((point) => (
                <li key={point} className="flex gap-3 leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-2 size-2 shrink-0 rounded-full"
                    style={{ background: COLOR.route }}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {signedOut && (
          <section className="border-t">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:flex-row sm:items-center sm:justify-between">
              <h2
                className={cn(
                  display.className,
                  "text-3xl leading-tight font-bold tracking-[-0.02em] sm:text-4xl",
                )}
              >
                Start with one PDF.
              </h2>
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Create an account
              </Link>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
