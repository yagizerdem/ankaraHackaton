import { Suspense } from "react";
import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { ExamList } from "@/app/student-panel/custom-exams/components/exam-list";
import { GenerateExamForm } from "@/app/student-panel/custom-exams/components/generate-exam-form";
import { getCustomExamsHome } from "@/app/student-panel/custom-exams/data";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";

export default function CustomExamsPage() {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Custom exams
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Write a printable exam from one of your documents: multiple choice,
          true / false or open-ended.
        </p>
      </header>

      {/* Reading the session cookie makes this part dynamic, so it streams in. */}
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}

async function HomeContent() {
  const home = await getCustomExamsHome();
  if (!home) return <SignInGate />;

  if (home.documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
        <FileQuestionIcon aria-hidden className="size-7 text-on-surface-variant" />
        <p className="text-title-md text-on-surface">No documents yet</p>
        <p className="max-w-sm text-body-sm text-on-surface-variant">
          Exams are written from your own documents. Upload one and let the
          pipeline embed it first.
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
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <GenerateExamForm documents={home.documents} />
      </div>
      <div className="min-w-0 lg:col-span-5">
        <ExamList exams={home.exams} />
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading exams" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="h-96 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:col-span-7" />
      <div className="h-96 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:col-span-5" />
    </div>
  );
}
