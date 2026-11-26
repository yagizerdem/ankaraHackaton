import { ChartColumnIcon } from "lucide-react";

import { ComingSoon } from "@/app/student-panel/components/coming-soon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Teacher and class analytics"
      description="How a whole class is doing on each topic."
      icon={ChartColumnIcon}
      plan="Class-wide analytics are coming. For now, students can share a read-only report with “Show my teacher” on their learning path, and the link opens here."
    />
  );
}
