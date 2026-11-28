import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { DeleteExamButton } from "@/app/student-panel/custom-exams/components/delete-exam-button";
import { ExamView } from "@/app/student-panel/custom-exams/components/exam-view";
import { getCustomExamPage } from "@/app/student-panel/custom-exams/data";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";
import { EXAM_LANGUAGE_LABELS } from "@/domain/custom-exam";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default function CustomExamPage({ params }: PageProps<"/student-panel/custom-exams/[id]">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <Link
        href="/student-panel/custom-exams"
        className="inline-flex w-fit items-center gap-1.5 rounded-lg text-label-md text-on-surface-variant transition-colors outline-none hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        All custom exams
      </Link>

      {/* Session and params are request-time data, so this streams in. */}
      <Suspense fallback={<ExamSkeleton />}>
        <ExamContent params={params} />
      </Suspense>
    </div>
  );
}

async function ExamContent({ params }: Pick<PageProps<"/student-panel/custom-exams/[id]">, "params">) {
  const { id } = await params;
  const exam = await getCustomExamPage(id);
  if (exam === "signed-out") return <SignInGate />;
  if (!exam) notFound();

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-headline-lg-mobile break-words text-on-surface sm:text-headline-lg">
            {exam.title}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {exam.documentName} · {exam.questions.length} questions ·{" "}
            <span className="capitalize">{exam.difficulty}</span> ·{" "}
            {EXAM_LANGUAGE_LABELS[exam.language]}
          </p>
          <time dateTime={exam.createdAt} className="text-mono-data text-on-surface-variant">
            {dateFormat.format(new Date(exam.createdAt))}
          </time>
        </div>
        <DeleteExamButton
          examId={exam.id}
          title={exam.title}
          redirectTo="/student-panel/custom-exams"
        />
      </header>
      <ExamView exam={exam} />
    </>
  );
}

function ExamSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading exam" className="flex flex-col gap-4">
      <div className="h-16 w-2/3 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none" />
      ))}
    </div>
  );
}
