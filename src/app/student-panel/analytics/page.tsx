import { ChartColumnIcon } from "lucide-react";

import { ComingSoon } from "@/app/student-panel/components/coming-soon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Teacher and class analytics"
      description="How a whole class is doing on each topic."
      icon={ChartColumnIcon}
      plan="Teachers will see mastery across the class, the topics most students struggle with, and which prerequisites cause the most gaps."
    />
  );
}
