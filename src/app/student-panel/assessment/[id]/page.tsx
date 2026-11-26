import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ExamRunner } from "@/app/student-panel/assessment/components/exam-runner";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";
import { AppError } from "@/error/app-error";
import { getAssessment } from "@/lib/assessment/service";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import HttpStatusCode from "@/lib/http-status-code";

import type { AssessmentView } from "@/domain/assessment";

export default function ExamPage({
  params,
}: PageProps<"/student-panel/assessment/[id]">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <h1 className="sr-only">Adaptive exam</h1>
      <Suspense fallback={<ExamSkeleton />}>
        <ExamContent params={params} />
      </Suspense>
    </div>
  );
}

async function ExamContent({
  params,
}: Pick<PageProps<"/student-panel/assessment/[id]">, "params">) {
  const { id } = await params;

  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await dbConnect();
  const user = await verifySessionAndGetUser(token);
  if (!user) return <SignInGate />;

  let view: AssessmentView;
  try {
    view = await getAssessment(id, user._id);
  } catch (error) {
    if (
      error instanceof AppError &&
      error.httpStatusCode === HttpStatusCode.NOT_FOUND
    ) {
      notFound();
    }
    throw error;
  }

  return <ExamRunner initial={view} />;
}

function ExamSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the exam"
      className="mx-auto flex w-full max-w-3xl flex-col gap-4"
    >
      <div className="h-1.5 animate-pulse rounded-full bg-surface-container motion-reduce:animate-none" />
      <div className="flex h-96 flex-col gap-4 rounded-xl bg-surface-container p-6">
        <div className="h-6 w-3/4 animate-pulse rounded bg-surface-container-high motion-reduce:animate-none" />
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-surface-container-high motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
