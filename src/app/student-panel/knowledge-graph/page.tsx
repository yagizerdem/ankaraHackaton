import { Suspense } from "react";
import Link from "next/link";
import { NetworkIcon } from "lucide-react";

import { GraphExplorer } from "@/app/student-panel/knowledge-graph/components/graph-explorer";
import { GraphPicker } from "@/app/student-panel/knowledge-graph/components/graph-picker";
import { getKnowledgeGraphs } from "@/app/student-panel/knowledge-graph/data";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";

export default function KnowledgeGraphPage({
  searchParams,
}: PageProps<"/student-panel/knowledge-graph">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Knowledge graph
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Topics from your documents and the prerequisites between them.
        </p>
      </header>

      {/* Session and search params are request-time data, so this streams in. */}
      <Suspense fallback={<GraphSkeleton />}>
        <GraphContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GraphContent({
  searchParams,
}: Pick<PageProps<"/student-panel/knowledge-graph">, "searchParams">) {
  const { graph } = await searchParams;
  const data = await getKnowledgeGraphs(
    typeof graph === "string" ? graph : undefined,
  );

  if (!data) return <SignInGate />;

  if (!data.selected) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
        <NetworkIcon aria-hidden className="size-7 text-on-surface-variant" />
        <p className="text-title-md text-on-surface">No knowledge graphs yet</p>
        <p className="max-w-sm text-body-sm text-on-surface-variant">
          Upload a document and run the pipeline. Its topics and their
          prerequisites will show up here.
        </p>
        <Link
          href="/student-panel/uploads"
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Go to uploads
        </Link>
      </div>
    );
  }

  return (
    <>
      <GraphPicker options={data.options} selectedId={data.selected.id} />
      <GraphExplorer graph={data.selected} />
    </>
  );
}

function GraphSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading knowledge graphs"
      className="flex flex-col gap-6"
    >
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-[5.5rem] w-60 shrink-0 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-[60dvh] min-h-[420px] animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none" />
        <div className="hidden animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:block" />
      </div>
    </div>
  );
}
