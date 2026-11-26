"use client";

import { useState } from "react";
import { DiagnosticQuestion } from "./components/diagnostic-question";
import { KnowledgeGraphPreview } from "./components/knowledge-graph-preview";
import { LearningPath } from "./components/learning-path";
import { PanelToolbar } from "./components/panel-toolbar";
import { StatCards } from "./components/stat-cards";
import { UploadCenter } from "./components/upload-center";
import { UploadDialog } from "./components/upload-dialog";
import { WelcomeBanner } from "./components/welcome-banner";

export default function StudentPanelPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const openUpload = () => setUploadOpen(true);

  return (
    <>
      <PanelToolbar onUploadClick={openUpload} />
      <div className="flex w-full flex-col gap-6 px-4 pb-6 sm:px-6">
        <section className="flex flex-col gap-4">
          <WelcomeBanner />
          <StatCards />
        </section>

        <UploadCenter onUpload={openUpload} />

        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <KnowledgeGraphPreview
              onStartRoute={() =>
                document.getElementById("learning-path")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
            <LearningPath />
            <DiagnosticQuestion />
          </div>
        </section>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
