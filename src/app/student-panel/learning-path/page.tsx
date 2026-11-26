import { RouteIcon } from "lucide-react";

import { ComingSoon } from "@/app/student-panel/components/coming-soon";

export default function LearningPathPage() {
  return (
    <ComingSoon
      title="Personal learning path"
      description="A study plan built from your knowledge graph and exam results."
      icon={RouteIcon}
      plan="Pick a goal topic and this page will order its prerequisites, skip what you've mastered, and tell you what to study or retest next."
    />
  );
}
